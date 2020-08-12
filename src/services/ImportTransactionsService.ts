import { In, getRepository, getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import csvParse from 'csv-parse';
import fs from 'fs';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';


interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const readStream = fs.createReadStream(filePath);

    const parser = csvParse({
      from_line: 2,
    });

    const parsedCSV = readStream.pipe(parser);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];


    parsedCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell: string)=> 
        cell.trim(),
      );

      if (!title || !type || !value) return;

      categories.push(category);
      transactions.push({title, type, value, category});

    })

    await new Promise (resolve => parsedCSV.on('end', resolve));

    const existingCategories = await categoriesRepository.find({
      where: {
        title: In(categories)
      },
    })

    const existingCategoriesTitles = existingCategories.map((category)=> category.title);

    const categoriesToBeAdded = categories.filter(category => !existingCategoriesTitles.includes(category)).filter((value, index, self)=> self.indexOf(value)=== index);

    const addedCategories = categoriesRepository.create(
      categoriesToBeAdded.map(title => ({ title }))
    );
    await categoriesRepository.save(addedCategories);

    const catObjects = [ ...addedCategories, ...existingCategories];

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: catObjects.find(category => category.title === transaction.category,)
      }))
    );

    await transactionsRepository.save(createdTransactions);

    return createdTransactions;


    console.log( existingCategoriesTitles,categoriesToBeAdded, addedCategories, transactions ) ;
    
  }
}

export default ImportTransactionsService;
