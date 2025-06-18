import React, { useState } from 'react'
import Calendar from './Calendar'

function App() {
  const [balance, setBalance] = useState(0)
  const [transaction, setTransaction] = useState({ date: '', amount: '', description: '' })
  const [transactions, setTransactions] = useState([])

  const handleBalanceSubmit = (e) => {
    e.preventDefault()
    const newBalance = parseFloat(e.target.balance.value)
    if (!isNaN(newBalance)) {
      setBalance(newBalance)
    }
  }

  const handleTransactionChange = (e) => {
    const { name, value } = e.target
    setTransaction({ ...transaction, [name]: value })
  }

  const handleTransactionSubmit = (e) => {
    e.preventDefault()
    if (transaction.date && transaction.amount) {
      setTransactions([...transactions, {
        ...transaction,
        amount: parseFloat(transaction.amount)
      }])
      setTransaction({ date: '', amount: '', description: '' })
    }
  }

  return (
    <div className="container">
      <h1>銀行残高と支払いカレンダー</h1>
      <section className="balance-section">
        <h2>銀行残高の登録</h2>
        <form onSubmit={handleBalanceSubmit}>
          <input type="number" name="balance" placeholder="銀行残高を入力" step="0.01" required />
          <button type="submit">登録</button>
        </form>
        <p>現在の銀行残高: {balance.toLocaleString()} 円</p>
      </section>
      <section className="transaction-section">
        <h2>支払い・引き落としの登録</h2>
        <form onSubmit={handleTransactionSubmit}>
          <input 
            type="date"
            name="date"
            value={transaction.date}
            onChange={handleTransactionChange}
            required
          />
          <input 
            type="number"
            name="amount"
            placeholder="金額を入力"
            step="0.01"
            value={transaction.amount}
            onChange={handleTransactionChange}
            required
          />
          <input 
            type="text"
            name="description"
            placeholder="説明"
            value={transaction.description}
            onChange={handleTransactionChange}
          />
          <button type="submit">追加</button>
        </form>
      </section>
      <section className="calendar-section">
        <h2>カレンダー</h2>
        <Calendar transactions={transactions} />
      </section>
    </div>
  )
}

export default App
