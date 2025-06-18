import React from 'react'

const getDaysInMonth = (year, month) => {
  const date = new Date(year, month, 1)
  const days = []
  while (date.getMonth() === month) {
    days.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }
  return days
}

function Calendar({ transactions }) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() // 0-indexed month

  const days = getDaysInMonth(year, month)

  const transactionsByDate = transactions.reduce((acc, tx) => {
    const key = tx.date
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(tx)
    return acc
  }, {})

  // Determine weekday of first day for proper grid placement
  const firstDayWeekday = new Date(year, month, 1).getDay()
  
  return (
    <div className="calendar">
      <div className="calendar-header">
        <h3>{year}年 {month + 1}月</h3>
      </div>
      <div className="calendar-grid">
        {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
          <div key={day} className="calendar-grid-header">{day}</div>
        ))}
        {Array.from({ length: firstDayWeekday }).map((_, index) => (
          <div key={`empty-${index}`} className="calendar-cell empty"></div>
        ))}
        {days.map(day => {
          const dayStr = day.toISOString().split('T')[0]
          return (
            <div key={dayStr} className="calendar-cell">
              <div className="date-number">{day.getDate()}</div>
              {transactionsByDate[dayStr] && transactionsByDate[dayStr].map((tx, index) => (
                <div key={index} className="transaction">
                  <span>{tx.description ? tx.description : '支払い'}</span>: {tx.amount.toLocaleString()} 円
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Calendar
