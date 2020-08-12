import { EntityRepository , Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}
interface Report {
  transactions: Transaction[];
  balance: Balance;
  
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getReport(): Promise<Report> {
    const transactions = await this.find();
    const {income, outcome } = transactions.reduce((accumulator, transaction)=> {
      switch(transaction.type){
        case "income":
          accumulator.income += Number(transaction.value);
          break;
        case "outcome":
          accumulator.outcome += Number(transaction.value);
          break;
        default:
          break;
      }
      return accumulator;
    }, {
      income: 0,
      outcome: 0,
      

    }
    
    );
    const total = income - outcome;
    return {transactions, balance: { income, outcome, total}}
  }
}

export default TransactionsRepository;
