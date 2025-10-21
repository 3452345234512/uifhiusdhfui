import { Link } from 'react-router-dom'
import App from './App'

function Calculator() {
  return (
    <>
      <App />
      {/* Кнопка перехода на детальную страницу */}
      <div className="fixed bottom-8 right-8 z-50">
        <Link 
          to="/details" 
          className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-full font-bold shadow-2xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105"
        >
          <span className="text-2xl">📊</span>
          <span>Детальный анализ</span>
        </Link>
      </div>
    </>
  )
}

export default Calculator

