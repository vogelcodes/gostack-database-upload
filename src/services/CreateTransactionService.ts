// import AppError from '../errors/AppError';

import { getCustomRepository, getRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({ title, value, category, type }: Request ): Promise<Transaction> {

    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const { balance } = await transactionsRepository.getReport();

    if ( type ==="outcome" && balance.total < value) {
      throw new AppError("You don't have funds", 400)
    }

    let transactionCategory = await categoriesRepository.findOne({
      where: {
        title: category
      },
    });

    if (!transactionCategory){
      transactionCategory = categoriesRepository.create({ title: category});
      await categoriesRepository.save(transactionCategory);
    }

    
    
    const transaction = transactionsRepository.create({title, value, category: transactionCategory, type});
    await transactionsRepository.save(transaction);
    return transaction;
    // TODO
  }
}

export default CreateTransactionService;
