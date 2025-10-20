import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './App.css'

function App() {
  // КЛЮЧЕВЫЕ ВВОДНЫЕ ПАРАМЕТРЫ
  
  // 1. Электроэнергия
  const [companyCostEE, setCompanyCostEE] = useState(5.4) // Себестоимость ЭЭ (₽/кВт⋅ч)
  const [clientCostEE, setClientCostEE] = useState(6.2) // Продажа ЭЭ клиенту (₽/кВт⋅ч)
  
  // 2. Токены  
  const [tokenPrice, setTokenPrice] = useState(25) // Продажа 1 TH ($)
  const [marginPercent, setMarginPercent] = useState(131.7) // Наценка в %
  
  // 3. Курс Bitcoin (из ViaBTC API)
  const [btcPriceNow, setBtcPriceNow] = useState(106497) // Курс BTC сейчас ($)
  const [btcPriceYear1, setBtcPriceYear1] = useState(150000) // Курс BTC через 1 год ($)
  const [btcPriceYear2, setBtcPriceYear2] = useState(200000) // Курс BTC через 2 года ($)
  
  // 4. Данные сети (из ViaBTC API)
  const [networkDifficulty, setNetworkDifficulty] = useState(146.72) // Сложность сети (T)
  const [btcPerTHPerDay, setBtcPerTHPerDay] = useState(0.00000043) // Доход BTC/TH/день
  
  // Вспомогательные константы (не редактируются пользователем)
  const usdtRate = 82 // Курс USDT к рублю
  const difficultyGrowth = 47.28 // Рост сложности в год (%)
  
  // Выбор оборудования
  const [selectedMiner, setSelectedMiner] = useState('T21')
  
  // Параметры оборудования
  const miners = {
    'T21': {
      name: 'Antminer T21',
      hashrate: 190, // TH
      power: 3610, // Вт
      price: 2050, // USD
      efficiency: 19 // Вт/TH
    },
    'S21Pro': {
      name: 'Antminer S21 Pro',
      hashrate: 245, // TH
      power: 3675, // Вт (из Excel файла)
      price: 3900, // USD (из Excel файла)
      efficiency: 15 // Вт/TH
    }
  }
  
  const currentMiner = miners[selectedMiner]
  
  // Расчёт себестоимости на основе выбранного оборудования
  const costPerTH = currentMiner.price / currentMiner.hashrate
  const calculatedMargin = ((tokenPrice / costPerTH - 1) * 100)
  
  // Расчётные значения на основе выбранного оборудования
  // Энергопотребление 1 TH за 24 часа с учётом +10% на инфраструктуру
  const energyPerTH = (currentMiner.power * 1.1 / currentMiner.hashrate) * 24 / 1000 // кВт/день
  const companyCostPerKwh = (companyCostEE / usdtRate) * energyPerTH // в $ за день на 1 TH
  const clientCostPerKwh = (clientCostEE / usdtRate) * energyPerTH // в $ за день на 1 TH
  const miningRevenuePerTH = btcPerTHPerDay * btcPriceNow // $ в день
  
  // Сценарии Bitcoin
  const btcScenarios = [
    { label: 'Медвежий', price: 50000 },
    { label: 'Низкий', price: 80000 },
    { label: 'Текущий', price: btcPriceNow },
    { label: 'Умеренный', price: 120000 },
    { label: 'Оптимистичный', price: 150000 },
    { label: 'Бычий', price: 200000 },
  ]
  
  // Сценарии продаж
  const scenarios = [
    { name: 'Базовый', tokens: 17150, asics: 90, thPerAsic: currentMiner.hashrate },
    { name: 'Средний', tokens: 30000, asics: 158, thPerAsic: currentMiner.hashrate },
    { name: 'Премиум', tokens: 75000, asics: 395, thPerAsic: currentMiner.hashrate },
  ]

  // Функция расчёта для одного сценария
  const calculateScenario = (tokens, asics, thPerAsic) => {
    const totalTH = asics * thPerAsic
    
    // 1. Доход от продажи токенов
    const profitPerToken = tokenPrice - costPerTH
    const tokenSalesRevenue = tokens * profitPerToken
    
    // 2. Доход от электроэнергии (за год)
    // Используем стоимость за день (уже умножено на energyPerTH)
    const companyCostPerDay = companyCostPerKwh
    const clientCostPerDay = clientCostPerKwh
    const energyProfitPerTHPerDay = clientCostPerDay - companyCostPerDay
    const energyProfitPerYear = energyProfitPerTHPerDay * totalTH * 365
    
    // 3. Инвестиции компании
    const totalInvestment = asics * thPerAsic * costPerTH
    
    // 4. Итоговый доход за год
    const totalRevenueYear1 = tokenSalesRevenue + energyProfitPerYear
    
    // 5. ROI для компании
    const companyROI = ((totalRevenueYear1 - totalInvestment) / totalInvestment) * 100
    
    // 6. Доходность для инвестора
    const investorDailyRevenue = miningRevenuePerTH - clientCostPerDay
    const investorAnnualRevenue = investorDailyRevenue * 365
    const investorROI = (investorAnnualRevenue / tokenPrice) * 100
    const paybackYears = tokenPrice / investorAnnualRevenue
    
    return {
      tokens,
      asics,
      totalTH,
      totalInvestment,
      tokenSalesRevenue,
      energyProfitPerYear,
      totalRevenueYear1,
      companyROI,
      investorDailyRevenue,
      investorAnnualRevenue,
      investorROI,
      paybackYears,
    }
  }

  // Расчёт всех сценариев
  const calculatedScenarios = useMemo(() => {
    return scenarios.map(s => ({
      ...s,
      ...calculateScenario(s.tokens, s.asics, s.thPerAsic)
    }))
  }, [costPerTH, tokenPrice, energyPerTH, companyCostPerKwh, clientCostPerKwh, miningRevenuePerTH])

  // Данные для графика (5 лет) с учётом роста сложности
  const chartData = useMemo(() => {
    const years = 5
    const data = []
    
    for (let year = 0; year <= years; year++) {
      const dataPoint = { year: `Год ${year}` }
      
      calculatedScenarios.forEach((scenario, idx) => {
        if (year === 0) {
          dataPoint[`scenario${idx}`] = 0
        } else {
          // Коэффициент снижения доходности из-за роста сложности
          // Доходность падает на difficultyGrowth% каждый год
          const miningRevenueFactor = Math.pow(1 - (difficultyGrowth / 100), year - 1)
          
          // Доход от майнинга с учётом падения доходности (для инвесторов)
          const adjustedMiningRevenue = scenario.investorAnnualRevenue * miningRevenueFactor
          
          // Общий доход компании
          if (year === 1) {
            // Первый год: продажа токенов + ЭЭ
            dataPoint[`scenario${idx}`] = scenario.tokenSalesRevenue + scenario.energyProfitPerYear
          } else {
            // Последующие годы: только ЭЭ (доход от токенов был в первый год)
            dataPoint[`scenario${idx}`] = scenario.tokenSalesRevenue + (scenario.energyProfitPerYear * year)
          }
        }
      })
      
      data.push(dataPoint)
    }
    
    return data
  }, [calculatedScenarios, difficultyGrowth])

  // Функция экспорта в текст (упрощенный вариант вместо PDF)
  const exportToText = () => {
    let text = '═══════════════════════════════════════════\n'
    text += '   КАЛЬКУЛЯТОР ROI МАЙНИНГА - ОТЧЁТ\n'
    text += '═══════════════════════════════════════════\n\n'
    
    text += '📊 ВВОДНЫЕ ПАРАМЕТРЫ:\n\n'
    
    text += '🖥️ ОБОРУДОВАНИЕ:\n'
    text += `• Модель: ${currentMiner.name}\n`
    text += `• Хешрейт: ${currentMiner.hashrate} TH/s\n`
    text += `• Потребление: ${currentMiner.power} Вт\n`
    text += `• Цена: $${currentMiner.price.toLocaleString()}\n`
    text += `• Эффективность: ${currentMiner.efficiency} Вт/TH\n`
    text += `• Энергопотребление 1 TH: ${energyPerTH.toFixed(3)} кВт/день\n\n`
    
    text += '⚡ ЭЛЕКТРОЭНЕРГИЯ:\n'
    text += `• Себестоимость ЭЭ: ${companyCostEE}₽/кВт⋅ч ($${(companyCostEE / usdtRate).toFixed(4)}/кВт⋅ч)\n`
    text += `• Продажа ЭЭ клиенту: ${clientCostEE}₽/кВт⋅ч ($${(clientCostEE / usdtRate).toFixed(4)}/кВт⋅ч)\n`
    text += `• Маржа: ${((clientCostEE - companyCostEE) / companyCostEE * 100).toFixed(1)}%\n\n`
    
    text += '💎 ТОКЕНЫ:\n'
    text += `• Себестоимость 1 TH: $${costPerTH.toFixed(2)}\n`
    text += `• Продажа 1 TH: $${tokenPrice}\n`
    text += `• Наценка: ${calculatedMargin.toFixed(1)}%\n`
    text += `• Прибыль от продажи: $${(tokenPrice - costPerTH).toFixed(2)}\n\n`
    
    text += '₿ КУРС BITCOIN:\n'
    text += `• Сейчас: $${btcPriceNow.toLocaleString()} (из ViaBTC API)\n`
    text += `• Через 1 год: $${btcPriceYear1.toLocaleString()} (прогноз)\n`
    text += `• Через 2 года: $${btcPriceYear2.toLocaleString()} (прогноз)\n\n`
    
    text += '🌐 ДАННЫЕ СЕТИ (из ViaBTC API):\n'
    text += `• Сложность сети: ${networkDifficulty} триллиона\n`
    text += `• Доход майнинга: ${btcPerTHPerDay.toFixed(8)} BTC/TH/день\n`
    text += `• Доход в USD: $${miningRevenuePerTH.toFixed(5)}/день\n`
    text += `• Рост сложности: ${difficultyGrowth}% в год\n\n`
    
    text += '📋 СПРАВОЧНО:\n'
    text += `• Курс USDT: ${usdtRate}₽\n`
    text += `• Рост сложности: ${difficultyGrowth}% в год\n`
    text += `• +10% на инфраструктуру (сеть, контейнер, вентиляция, аптайм)\n\n`
    
    text += '⚠️ ВАЖНО: Сложность сети растёт ~' + difficultyGrowth + '% в год,\n'
    text += 'что снижает доходность майнинга на тот же процент при неизменной цене BTC\n\n'
    
    // Добавляем сценарии Bitcoin
    text += '═══════════════════════════════════════════\n'
    text += '  СЦЕНАРИИ BITCOIN (при текущей сложности)\n'
    text += '═══════════════════════════════════════════\n\n'
    
    btcScenarios.forEach((scenario) => {
      const miningRev = btcPerTHPerDay * scenario.price
      const clientCost = (clientCostEE / usdtRate) * energyPerTH
      const netRevenue = miningRev - clientCost
      const annualRevenue = netRevenue * 365
      const roi = (annualRevenue / tokenPrice) * 100
      const payback = tokenPrice / annualRevenue
      
      text += `${scenario.label}: $${scenario.price.toLocaleString()}\n`
      text += `  Доход майнинга: $${miningRev.toFixed(5)}/день\n`
      text += `  Чистый доход: $${netRevenue.toFixed(5)}/день ($${annualRevenue.toFixed(2)}/год)\n`
      text += `  ROI инвестора: ${roi.toFixed(1)}%\n`
      text += `  Окупаемость: ${payback.toFixed(2)} лет\n\n`
    })
    
    text += '═══════════════════════════════════════════\n'
    text += '  ЦЕЛЕВЫЕ ПОКАЗАТЕЛИ\n'
    text += '═══════════════════════════════════════════\n\n'
    
    text += '🎯 ТРЕБОВАНИЯ:\n'
    text += '• ROI клиента: 33% годовых (с учётом роста сложности + роста BTC 10-15%)\n'
    text += '• Наша прибыль от токенов: 30-40%\n'
    text += '• Наша прибыль от ЭЭ: ≥30% (с учётом налогов)\n'
    text += '• Срок жизни оборудования: 3 года\n\n'
    
    text += '💡 ТЕКУЩИЕ ПОКАЗАТЕЛИ:\n'
    text += `• Наценка на токены: ${calculatedMargin.toFixed(1)}% ${calculatedMargin >= 30 && calculatedMargin <= 40 ? '✅' : '⚠️'}\n`
    text += `• Маржа ЭЭ: ${((clientCostEE - companyCostEE) / companyCostEE * 100).toFixed(1)}% ${((clientCostEE - companyCostEE) / companyCostEE * 100) >= 30 ? '✅' : '⚠️'}\n\n`
    
    calculatedScenarios.forEach((s, idx) => {
      text += `\n${'═'.repeat(43)}\n`
      text += `📦 СЦЕНАРИЙ ${idx + 1}: ${s.name.toUpperCase()}\n`
      text += `${'═'.repeat(43)}\n`
      text += `• Токенов: ${s.tokens.toLocaleString()}\n`
      text += `• Асиков: ${s.asics}\n`
      text += `• Мощность: ${s.totalTH.toLocaleString()} TH\n`
      text += `• Инвестиции: $${s.totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}\n\n`
      text += `💰 ДОХОД КОМПАНИИ (год 1):\n`
      text += `• От продажи токенов: $${s.tokenSalesRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}\n`
      text += `• От электроэнергии: $${s.energyProfitPerYear.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}\n`
      text += `• ИТОГО: $${s.totalRevenueYear1.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}\n`
      text += `• ROI компании: ${s.companyROI.toFixed(1)}%\n\n`
      text += `📈 ДОХОДНОСТЬ ИНВЕСТОРА (при текущей сложности):\n`
      text += `• Чистый доход: $${s.investorDailyRevenue.toFixed(4)}/день\n`
      text += `• Годовой доход: $${s.investorAnnualRevenue.toFixed(2)}\n`
      text += `• ROI: ${s.investorROI.toFixed(2)}% годовых\n`
      text += `• Окупаемость: ${s.paybackYears.toFixed(2)} лет\n\n`
      
      // Добавим прогноз с учётом роста сложности
      text += `📉 ПРОГНОЗ С УЧЁТОМ РОСТА СЛОЖНОСТИ (${difficultyGrowth}%):\n`
      for (let year = 1; year <= 3; year++) {
        const factor = Math.pow(1 - (difficultyGrowth / 100), year - 1)
        const adjustedRevenue = s.investorAnnualRevenue * factor
        const adjustedROI = (adjustedRevenue / tokenPrice) * 100
        text += `• Год ${year}: доход $${adjustedRevenue.toFixed(2)} (ROI ${adjustedROI.toFixed(2)}%)\n`
      }
    })
    
    text += `\n${'═'.repeat(43)}\n`
    text += `Дата создания: ${new Date().toLocaleString('ru-RU')}\n`
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `roi_calculator_${Date.now()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            💎 Калькулятор ROI Майнинга
          </h1>
          <p className="text-white/80 text-lg mb-3">
            Расчёт доходности для компании и инвесторов
          </p>
          <div className="flex flex-col md:flex-row gap-3 justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3">
              <p className="text-white font-semibold">
                🖥️ {currentMiner.name} ({currentMiner.hashrate} TH, {currentMiner.power} Вт)
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3">
              <p className="text-white font-semibold">
                📊 Сложность: {networkDifficulty}T | Рост: ~{difficultyGrowth}% в год
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3">
              <p className="text-white font-semibold">
                ₿ BTC: ${btcPriceNow.toLocaleString()} | {btcPerTHPerDay.toFixed(8)} BTC/TH/день
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3">
              <p className="text-white text-sm">
                📡 <a href="https://www.viabtc.com/res/tools/calculator?coin=BTC" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-200">ViaBTC API</a>
              </p>
            </div>
          </div>
        </div>

        {/* Панель настроек */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">⚙️ Вводные параметры</h2>
          
          {/* 0. ВЫБОР ОБОРУДОВАНИЯ */}
          <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border-2 border-indigo-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-indigo-500">🖥️</span> Выбор оборудования
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(miners).map(([key, miner]) => (
                <div
                  key={key}
                  onClick={() => setSelectedMiner(key)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedMiner === key
                      ? 'bg-indigo-600 text-white shadow-lg scale-105'
                      : 'bg-white border-2 border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  <div className="font-bold text-lg mb-2">{miner.name}</div>
                  <div className="text-sm space-y-1">
                    <div>⚡ Хешрейт: {miner.hashrate} TH/s</div>
                    <div>🔌 Потребление: {miner.power} Вт</div>
                    <div>💰 Цена: ${miner.price.toLocaleString()}</div>
                    <div>📊 Эффективность: {miner.efficiency} Вт/TH</div>
                    <div className="mt-2 pt-2 border-t border-current/20">
                      <strong>Себестоимость 1 TH: ${(miner.price / miner.hashrate).toFixed(2)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 1. ЭЛЕКТРОЭНЕРГИЯ */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-yellow-500">⚡</span> Электроэнергия
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Себестоимость ЭЭ (₽/кВт⋅ч)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={companyCostEE}
                  onChange={(e) => setCompanyCostEE(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
                <div className="text-xs text-gray-500 mt-1">
                  ≈ ${(companyCostEE / usdtRate).toFixed(4)}/кВт⋅ч
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Продажа ЭЭ клиенту (₽/кВт⋅ч)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={clientCostEE}
                  onChange={(e) => setClientCostEE(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
                <div className="text-xs text-gray-500 mt-1">
                  ≈ ${(clientCostEE / usdtRate).toFixed(4)}/кВт⋅ч
                </div>
              </div>
            </div>
          </div>

          {/* 2. ТОКЕНЫ */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-purple-500">💎</span> Токены (1 TH)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Себестоимость 1 TH ($)
                </label>
                <div className="text-2xl font-bold text-gray-900">
                  ${costPerTH.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ${currentMiner.price} / {currentMiner.hashrate} TH
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Продажа 1 TH ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={tokenPrice}
                  onChange={(e) => setTokenPrice(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-lg font-semibold"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Цена для клиента
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                <label className="block text-sm font-semibold text-green-700 mb-2">
                  Наша наценка (%)
                </label>
                <div className="text-2xl font-bold text-green-700">
                  {calculatedMargin.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Прибыль: ${(tokenPrice - costPerTH).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* 3. КУРС BITCOIN */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-orange-500">₿</span> Курс Bitcoin
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Сейчас ($)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={btcPriceNow}
                  onChange={(e) => setBtcPriceNow(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none bg-blue-50"
                />
                <div className="text-xs text-gray-500 mt-1">
                  📡 Из ViaBTC API
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Через 1 год ($)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={btcPriceYear1}
                  onChange={(e) => setBtcPriceYear1(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Прогноз
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Через 2 года ($)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={btcPriceYear2}
                  onChange={(e) => setBtcPriceYear2(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Прогноз
                </div>
              </div>
            </div>
          </div>

          {/* 4. ДАННЫЕ СЕТИ */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-blue-500">🌐</span> Данные сети
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Сложность сети (триллионов)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={networkDifficulty}
                  onChange={(e) => setNetworkDifficulty(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none bg-blue-50"
                />
                <div className="text-xs text-gray-500 mt-1">
                  📡 Из ViaBTC API
                </div>
              </div>
      <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Доход (BTC/TH/день)
                </label>
                <input
                  type="number"
                  step="0.00000001"
                  value={btcPerTHPerDay}
                  onChange={(e) => setBtcPerTHPerDay(parseFloat(e.target.value))}
                  className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none bg-blue-50"
                />
                <div className="text-xs text-gray-500 mt-1">
                  ≈ ${miningRevenuePerTH.toFixed(5)}/день | 📡 Из ViaBTC API
                </div>
              </div>
            </div>
          </div>

          {/* Кнопка экспорта и ключевые показатели */}
          <div className="mt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
              💡 <strong>Наценка:</strong> {((tokenPrice / costPerTH - 1) * 100).toFixed(1)}% 
              {' | '}
              <strong>Прибыль от токена:</strong> ${(tokenPrice - costPerTH).toFixed(2)}
              {' | '}
              <strong>ROI инвестора:</strong> ~{calculatedScenarios[0]?.investorROI.toFixed(1)}% годовых
      </div>
            <button
              onClick={exportToText}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg whitespace-nowrap"
            >
              📥 Экспортировать отчёт (TXT)
        </button>
          </div>
        </div>

        {/* Блок с формулами расчёта */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">📐 Формулы и расчёты ROI</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ROI для инвестора */}
            <div className="bg-blue-50 p-5 rounded-xl border-2 border-blue-300">
              <h3 className="text-xl font-bold text-blue-900 mb-4">💼 ROI для инвестора</h3>
              
              <div className="space-y-3 text-sm">
                <div className="bg-white p-3 rounded-lg">
                  <div className="font-bold text-gray-700 mb-2">1️⃣ Валовый доход от майнинга (за день на 1 TH):</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mb-1">
                    = BTC/TH/день × Цена BTC
                  </div>
                  <div className="text-blue-700 font-semibold">
                    = {btcPerTHPerDay.toFixed(8)} × ${btcPriceNow.toLocaleString()} = ${miningRevenuePerTH.toFixed(5)}/день
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg">
                  <div className="font-bold text-gray-700 mb-2">2️⃣ Затраты на электроэнергию (за день на 1 TH):</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mb-1">
                    = Тариф клиента (₽/кВт⋅ч) / Курс USDT × Энергопотребление (кВт/день)
                  </div>
                  <div className="text-blue-700 font-semibold">
                    = {clientCostEE}₽ / {usdtRate} × {energyPerTH.toFixed(3)} кВт = ${clientCostPerKwh.toFixed(5)}/день
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    * Энергопотребление 1 TH = ({currentMiner.power} Вт × 1.1) / {currentMiner.hashrate} TH × 24ч / 1000 = {energyPerTH.toFixed(3)} кВт/день
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg">
                  <div className="font-bold text-gray-700 mb-2">3️⃣ Чистый доход (за день на 1 TH):</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mb-1">
                    = Валовый доход - Затраты на ЭЭ
                  </div>
                  <div className="text-blue-700 font-semibold">
                    = ${miningRevenuePerTH.toFixed(5)} - ${clientCostPerKwh.toFixed(5)} = ${(miningRevenuePerTH - clientCostPerKwh).toFixed(5)}/день
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg">
                  <div className="font-bold text-gray-700 mb-2">4️⃣ Годовой доход:</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mb-1">
                    = Чистый доход/день × 365
                  </div>
                  <div className="text-blue-700 font-semibold">
                    = ${(miningRevenuePerTH - clientCostPerKwh).toFixed(5)} × 365 = ${((miningRevenuePerTH - clientCostPerKwh) * 365).toFixed(2)}/год
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-lg">
                  <div className="font-bold mb-2">5️⃣ ROI инвестора:</div>
                  <div className="font-mono text-xs bg-white/20 p-2 rounded mb-1">
                    = (Годовой доход / Цена токена) × 100%
                  </div>
                  <div className="text-xl font-bold">
                    = (${((miningRevenuePerTH - clientCostPerKwh) * 365).toFixed(2)} / ${tokenPrice}) × 100% = {(((miningRevenuePerTH - clientCostPerKwh) * 365 / tokenPrice) * 100).toFixed(2)}%
                  </div>
                  <div className="text-sm mt-2 opacity-90">
                    Окупаемость: {(tokenPrice / ((miningRevenuePerTH - clientCostPerKwh) * 365)).toFixed(2)} лет
                  </div>
                </div>
              </div>
            </div>

            {/* ROI для компании */}
            <div className="bg-green-50 p-5 rounded-xl border-2 border-green-300">
              <h3 className="text-xl font-bold text-green-900 mb-4">🏢 ROI для компании</h3>
              
              <div className="space-y-3 text-sm">
                <div className="bg-white p-3 rounded-lg">
                  <div className="font-bold text-gray-700 mb-2">1️⃣ Себестоимость 1 TH:</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mb-1">
                    = Цена асика / Хешрейт асика
                  </div>
                  <div className="text-green-700 font-semibold">
                    = ${currentMiner.price.toLocaleString()} / {currentMiner.hashrate} TH = ${costPerTH.toFixed(2)}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg">
                  <div className="font-bold text-gray-700 mb-2">2️⃣ Прибыль от продажи токена (единовременно):</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mb-1">
                    = Цена токена - Себестоимость
                  </div>
                  <div className="text-green-700 font-semibold">
                    = ${tokenPrice} - ${costPerTH.toFixed(2)} = ${(tokenPrice - costPerTH).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Наценка: {calculatedMargin.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg">
                  <div className="font-bold text-gray-700 mb-2">3️⃣ Прибыль от перепродажи ЭЭ (за день на 1 TH):</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mb-1">
                    = (Тариф клиента - Себестоимость ЭЭ) / Курс × Энергопотребление
                  </div>
                  <div className="text-green-700 font-semibold">
                    = ({clientCostEE}₽ - {companyCostEE}₽) / {usdtRate} × {energyPerTH.toFixed(3)} кВт = ${(clientCostPerKwh - companyCostPerKwh).toFixed(5)}/день
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    За год: ${((clientCostPerKwh - companyCostPerKwh) * 365).toFixed(2)}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg">
                  <div className="font-bold text-gray-700 mb-2">4️⃣ Общий доход за первый год (на 1 TH):</div>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mb-1">
                    = Прибыль от токена + Прибыль от ЭЭ за год
                  </div>
                  <div className="text-green-700 font-semibold">
                    = ${(tokenPrice - costPerTH).toFixed(2)} + ${((clientCostPerKwh - companyCostPerKwh) * 365).toFixed(2)} = ${((tokenPrice - costPerTH) + (clientCostPerKwh - companyCostPerKwh) * 365).toFixed(2)}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-lg">
                  <div className="font-bold mb-2">5️⃣ ROI компании (первый год):</div>
                  <div className="font-mono text-xs bg-white/20 p-2 rounded mb-1">
                    = (Общий доход / Себестоимость - 1) × 100%
                  </div>
                  <div className="text-xl font-bold">
                    = (${((tokenPrice - costPerTH) + (clientCostPerKwh - companyCostPerKwh) * 365).toFixed(2)} / ${costPerTH.toFixed(2)} - 1) × 100% = {((((tokenPrice - costPerTH) + (clientCostPerKwh - companyCostPerKwh) * 365) / costPerTH - 1) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm mt-2 opacity-90">
                    Маржа от ЭЭ: {((clientCostEE - companyCostEE) / companyCostEE * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Важные замечания */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
            <h4 className="font-bold text-yellow-900 mb-2">⚠️ Важные факторы:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• <strong>Рост сложности сети:</strong> {difficultyGrowth}% в год снижает доходность майнинга на тот же процент</li>
              <li>• <strong>Изменение цены BTC:</strong> напрямую влияет на валовый доход инвестора</li>
              <li>• <strong>Срок жизни оборудования:</strong> ~3 года, после чего эффективность падает</li>
              <li>• <strong>Инфраструктура:</strong> +10% к энергопотреблению (сеть, охлаждение, контейнер)</li>
              <li>• <strong>Для компании:</strong> доход от токенов - единовременный, от ЭЭ - ежегодный</li>
              <li>• <strong>Для инвестора:</strong> чистый доход = майнинг минус оплата ЭЭ</li>
            </ul>
          </div>
        </div>

        {/* Таблица сценариев Bitcoin */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-8 overflow-x-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">₿ Сравнение сценариев Bitcoin</h2>
          <p className="text-gray-600 mb-4">
            Как изменяется доходность инвестора при разных ценах BTC (при текущей сложности сети)
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
                  <th className="px-4 py-3 text-left rounded-tl-lg">Сценарий BTC</th>
                  <th className="px-4 py-3 text-center">Цена BTC</th>
                  <th className="px-4 py-3 text-center">Доход майнинга ($/день)</th>
                  <th className="px-4 py-3 text-center">Чистый доход инвестора</th>
                  <th className="px-4 py-3 text-center">ROI инвестора</th>
                  <th className="px-4 py-3 text-center rounded-tr-lg">Окупаемость</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {btcScenarios.map((scenario, idx) => {
                  const miningRev = btcPerTHPerDay * scenario.price
                  const clientCost = (clientCostEE / usdtRate)
                  const netRevenue = miningRev - clientCost
                  const annualRevenue = netRevenue * 365
                  const roi = (annualRevenue / tokenPrice) * 100
                  const payback = tokenPrice / annualRevenue
                  
                  const rowColor = 
                    roi >= 30 ? 'bg-green-50' :
                    roi >= 20 ? 'bg-yellow-50' :
                    roi >= 10 ? 'bg-orange-50' : 'bg-red-50'
                  
                  return (
                    <tr key={idx} className={`hover:bg-opacity-70 ${rowColor}`}>
                      <td className="px-4 py-3 font-semibold">{scenario.label}</td>
                      <td className="px-4 py-3 text-center font-bold">${scenario.price.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">${miningRev.toFixed(5)}</td>
                      <td className="px-4 py-3 text-center">
                        ${netRevenue.toFixed(5)}/день<br/>
                        <span className="text-xs text-gray-600">${annualRevenue.toFixed(2)}/год</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold text-lg ${
                          roi >= 30 ? 'text-green-700' :
                          roi >= 20 ? 'text-yellow-700' :
                          roi >= 10 ? 'text-orange-700' : 'text-red-700'
                        }`}>
                          {roi.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {payback.toFixed(2)} лет
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-700">
              💡 <strong>Справка:</strong> Цвета показывают уровень ROI - 
              <span className="text-green-700 font-semibold"> зелёный (≥30%)</span>,
              <span className="text-yellow-700 font-semibold"> жёлтый (20-30%)</span>,
              <span className="text-orange-700 font-semibold"> оранжевый (10-20%)</span>,
              <span className="text-red-700 font-semibold"> красный {'(<'}10%)</span>
        </p>
      </div>
        </div>

        {/* Калькулятор подбора оптимальной цены */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-400 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-purple-900 mb-4 flex items-center gap-2">
            🎯 Калькулятор оптимальной цены токена
          </h2>
          <p className="text-gray-700 mb-6">
            Подберите цену токена для выполнения всех требований к доходности
          </p>

          {(() => {
            // Предварительные расчёты для отображения
            const currentAnnualRevenue = (miningRevenuePerTH - clientCostPerKwh) * 365
            const eeMargin = ((clientCostEE - companyCostEE) / companyCostEE * 100)
            
            return (
              <>
                {/* Блок целевых требований */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-xl border-2 border-blue-400 shadow-lg">
                    <div className="text-sm text-blue-600 font-semibold mb-2">🎯 ТРЕБОВАНИЕ 1 (критично):</div>
                    <div className="text-xl font-bold text-blue-900 mb-1">ROI клиента ≥33%</div>
                    <div className="text-xs text-gray-600 mb-2">
                      С учётом роста сложности {difficultyGrowth}% + рост BTC 10-15% в год
                    </div>
                    <div className="text-xs bg-blue-50 p-2 rounded">
                      ⏱️ Срок жизни оборудования: 3 года
                    </div>
                    <div className="mt-2 text-sm">
                      Текущий ROI: <span className={`font-bold ${(currentAnnualRevenue / tokenPrice * 100) >= 33 ? 'text-green-600' : 'text-red-600'}`}>
                        {(currentAnnualRevenue / tokenPrice * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border-2 border-green-400 shadow-lg">
                    <div className="text-sm text-green-600 font-semibold mb-2">🎯 ТРЕБОВАНИЕ 2 (критично):</div>
                    <div className="text-xl font-bold text-green-900 mb-1">Наша наценка 30-40%</div>
                    <div className="text-xs text-gray-600 mb-2">
                      От продажи токенов (монет)
                    </div>
                    <div className="text-xs bg-green-50 p-2 rounded">
                      💰 Основной источник дохода компании
                    </div>
                    <div className="mt-2 text-sm">
                      Текущая наценка: <span className={`font-bold ${calculatedMargin >= 30 && calculatedMargin <= 40 ? 'text-green-600' : 'text-red-600'}`}>
                        {calculatedMargin.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Дополнительная информация о марже ЭЭ */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-300">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">ℹ️</div>
                    <div>
                      <div className="font-bold text-gray-800 mb-1">О марже ЭЭ:</div>
                      <div className="text-sm text-gray-700">
                        Текущая маржа {eeMargin.toFixed(1)}% ({companyCostEE}₽ → {clientCostEE}₽) вполне достаточна. 
                        <strong> Основной доход компании идёт от продажи токенов, а не от перепродажи электроэнергии.</strong>
                        {' '}Повышение тарифа ЭЭ снизит привлекательность для клиентов.
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )
          })()}

          {/* Симулятор оптимальной цены */}
          <div className="bg-white p-6 rounded-xl border-2 border-purple-300 mb-6">
            <h3 className="text-xl font-bold text-purple-900 mb-4">🔧 Подбор оптимальной цены</h3>
            
            {(() => {
              // Рассчитываем оптимальную цену для выполнения всех требований
              
              // 1. Для наценки 30-40%
              const minPriceForMargin = costPerTH * 1.30  // 30% наценка
              const maxPriceForMargin = costPerTH * 1.40  // 40% наценка
              
              // 2. Для ROI клиента 33% с учётом роста сложности за 3 года
              // Нужно учесть падение доходности из-за роста сложности
              // За 3 года доходность упадёт: год1: 100%, год2: 52.72%, год3: 27.79%
              // Средняя доходность за 3 года: (100 + 52.72 + 27.79) / 3 = 60.17%
              // Плюс рост BTC 10-15% компенсирует часть падения
              
              // Упрощённо: для 33% ROI нужно, чтобы годовой доход был 33% от цены токена
              const targetAnnualRevenue = tokenPrice * 0.33
              const currentAnnualRevenue = (miningRevenuePerTH - clientCostPerKwh) * 365
              
              // Рассчитываем необходимую цену BTC для 33% ROI при текущей цене токена
              const neededBtcPriceForTarget = (targetAnnualRevenue / 365 + clientCostPerKwh) / btcPerTHPerDay
              
              // Или наоборот - при текущей цене BTC какая должна быть цена токена для 33% ROI
              const optimalTokenPriceForRoi = currentAnnualRevenue / 0.33
              
              // 3. Для маржи ЭЭ 30%
              const neededClientEE = companyCostEE * 1.30  // Нужно 30% маржи
              
              // Итоговые рекомендации
              const recommendations = {
                tokenPrice: {
                  forMargin: { min: minPriceForMargin, max: maxPriceForMargin },
                  forRoi: optimalTokenPriceForRoi,
                  optimal: Math.max(minPriceForMargin, Math.min(maxPriceForMargin, optimalTokenPriceForRoi))
                },
                btcPrice: neededBtcPriceForTarget,
                eeClient: neededClientEE
              }
              
              const checkMargin = calculatedMargin >= 30 && calculatedMargin <= 40
              const checkRoi = (currentAnnualRevenue / tokenPrice * 100) >= 33
              const eeMargin = ((clientCostEE - companyCostEE) / companyCostEE * 100)
              
              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Текущие показатели */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-gray-800 mb-3">📊 Текущие показатели:</h4>
                      
                      <div className={`p-3 rounded-lg ${checkMargin ? 'bg-green-100 border-2 border-green-400' : 'bg-red-100 border-2 border-red-400'}`}>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Наценка на токены:</span>
                          <span className="font-bold text-lg">{calculatedMargin.toFixed(1)}% {checkMargin ? '✅' : '❌'}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Цель: 30-40% (обязательно)
                        </div>
                      </div>

                      <div className={`p-3 rounded-lg ${checkRoi ? 'bg-green-100 border-2 border-green-400' : 'bg-red-100 border-2 border-red-400'}`}>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">ROI клиента (год 1):</span>
                          <span className="font-bold text-lg">{(currentAnnualRevenue / tokenPrice * 100).toFixed(1)}% {checkRoi ? '✅' : '❌'}</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Цель: ≥33% (обязательно)
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-gray-50 border-2 border-gray-300">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Маржа ЭЭ:</span>
                          <span className="font-bold text-lg">{eeMargin.toFixed(1)}%</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Текущая: {companyCostEE}₽ → {clientCostEE}₽ (разница: {(clientCostEE - companyCostEE).toFixed(1)}₽)
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          ℹ️ Маржа ЭЭ - не критична, основной доход от токенов
                        </div>
                      </div>
                    </div>

                    {/* Рекомендации */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-gray-800 mb-3">💡 Рекомендации:</h4>
                      
                      <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border-2 border-purple-300">
                        <div className="font-bold text-purple-900 mb-2">Оптимальная цена токена:</div>
                        <div className="text-3xl font-bold text-purple-700 mb-2">
                          ${recommendations.tokenPrice.optimal.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-700 space-y-1">
                          <div>• Для наценки 30-40%: ${minPriceForMargin.toFixed(2)} - ${maxPriceForMargin.toFixed(2)}</div>
                          <div>• Для ROI 33%: ${optimalTokenPriceForRoi.toFixed(2)}</div>
                          <div>• Текущая цена: ${tokenPrice} {tokenPrice >= minPriceForMargin && tokenPrice <= maxPriceForMargin ? '✅' : '⚠️'}</div>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-100 rounded-lg border-2 border-blue-300">
                        <div className="font-bold text-blue-900 mb-2">Альтернатива: дождаться роста BTC</div>
                        <div className="text-2xl font-bold text-blue-700 mb-1">
                          ${Math.round(neededBtcPriceForTarget).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-700">
                          Текущая: ${btcPriceNow.toLocaleString()} (нужен рост на {((neededBtcPriceForTarget / btcPriceNow - 1) * 100).toFixed(0)}%)
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          При такой цене BTC можно оставить текущую цену токена $25
                        </div>
                      </div>

                      <div className="p-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                        <div className="font-bold text-gray-900 mb-2">Прибыль от ЭЭ:</div>
                        <div className="text-2xl font-bold text-gray-700 mb-1">
                          {((clientCostEE - companyCostEE) / companyCostEE * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-700">
                          ${((clientCostPerKwh - companyCostPerKwh) * 365).toFixed(2)}/год на 1 TH
                        </div>
                        <div className="text-xs text-blue-600 mt-2">
                          ✓ Маржа ЭЭ не критична - основной доход от токенов
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Итоговое резюме */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border-2 border-yellow-400">
                    <h4 className="font-bold text-yellow-900 mb-3">📝 Итоговое резюме:</h4>
                    <div className="space-y-2 text-sm text-gray-800">
                      {checkMargin && checkRoi ? (
                        <div className="bg-green-200 p-3 rounded-lg border-2 border-green-500">
                          <div className="font-bold text-green-900 text-lg mb-2">✅ Основные требования выполнены!</div>
                          <div>Наценка и ROI клиента соответствуют целям</div>
                          <div className="text-xs text-gray-600 mt-2">
                            Маржа ЭЭ: {eeMargin.toFixed(1)}% (не критично, основной доход от продажи токенов)
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="font-bold text-orange-900 mb-2">⚠️ Для выполнения основных требований:</div>
                          {!checkMargin && (
                            <div className="bg-white p-3 rounded border-l-4 border-red-500">
                              <div className="font-semibold text-red-800 mb-1">❌ Наценка слишком высокая ({calculatedMargin.toFixed(1)}%)</div>
                              <div className="text-gray-700">
                                → Снизьте цену токена до <strong>${minPriceForMargin.toFixed(2)}-${maxPriceForMargin.toFixed(2)}</strong>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Это даст наценку 30-40% при себестоимости ${costPerTH.toFixed(2)}
                              </div>
                            </div>
                          )}
                          {!checkRoi && (
                            <div className="bg-white p-3 rounded border-l-4 border-orange-500">
                              <div className="font-semibold text-orange-800 mb-1">❌ ROI клиента низкий ({(currentAnnualRevenue / tokenPrice * 100).toFixed(1)}%)</div>
                              <div className="text-gray-700">
                                <strong>Вариант 1:</strong> Снизьте цену токена до <strong>${optimalTokenPriceForRoi.toFixed(2)}</strong>
                              </div>
                              <div className="text-gray-700">
                                <strong>Вариант 2:</strong> Дождитесь роста BTC до <strong>${Math.round(neededBtcPriceForTarget).toLocaleString()}</strong> (рост на {((neededBtcPriceForTarget / btcPriceNow - 1) * 100).toFixed(0)}%)
                              </div>
                            </div>
                          )}
                          
                          {checkMargin && checkRoi && (
                            <div className="bg-green-100 p-3 rounded border-l-4 border-green-500">
                              <div className="font-semibold text-green-800">✅ Отлично! Оба основных требования выполнены</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )
            })()}
          </div>

          {/* Симуляция на 3 года */}
          <div className="bg-white p-6 rounded-xl border-2 border-purple-300">
            <h3 className="text-xl font-bold text-purple-900 mb-4">📅 Прогноз доходности на 3 года</h3>
            <p className="text-sm text-gray-600 mb-4">
              С учётом падения доходности на {difficultyGrowth}% в год и роста BTC на 10-15% в год
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                    <th className="px-4 py-3 text-left rounded-tl-lg">Год</th>
                    <th className="px-4 py-3 text-center">Цена BTC</th>
                    <th className="px-4 py-3 text-center">Доходность майнинга</th>
                    <th className="px-4 py-3 text-center">Чистый доход</th>
                    <th className="px-4 py-3 text-center rounded-tr-lg">ROI клиента</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[1, 2, 3].map((year) => {
                    // Предполагаем рост BTC на 12.5% в год (среднее между 10-15%)
                    const btcGrowth = 1.125
                    const btcPriceYear = btcPriceNow * Math.pow(btcGrowth, year)
                    
                    // Падение доходности из-за роста сложности
                    const difficultyFactor = Math.pow(1 - difficultyGrowth / 100, year)
                    
                    // Скорректированный доход
                    const adjustedMiningRev = (btcPerTHPerDay * btcPriceYear) * difficultyFactor
                    const netRevenue = adjustedMiningRev - clientCostPerKwh
                    const annualRevenue = netRevenue * 365
                    const roi = (annualRevenue / tokenPrice) * 100
                    
                    const rowColor = roi >= 33 ? 'bg-green-50' : roi >= 20 ? 'bg-yellow-50' : 'bg-red-50'
                    
                    return (
                      <tr key={year} className={rowColor}>
                        <td className="px-4 py-3 font-bold">Год {year}</td>
                        <td className="px-4 py-3 text-center font-semibold">
                          ${Math.round(btcPriceYear).toLocaleString()}
                          <div className="text-xs text-gray-500">+{((btcGrowth - 1) * 100).toFixed(1)}%/год</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {(difficultyFactor * 100).toFixed(1)}% от начальной
                          <div className="text-xs text-gray-500">${adjustedMiningRev.toFixed(5)}/день</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          ${netRevenue.toFixed(5)}/день
                          <div className="text-xs text-gray-500">${annualRevenue.toFixed(2)}/год</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold text-lg ${
                            roi >= 33 ? 'text-green-700' : roi >= 20 ? 'text-yellow-700' : 'text-red-700'
                          }`}>
                            {roi.toFixed(1)}% {roi >= 33 ? '✅' : roi >= 20 ? '⚠️' : '❌'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                💡 <strong>Важно:</strong> Даже с ростом BTC на 12.5% в год, доходность снижается из-за роста сложности. 
                К 3-му году ROI падает ниже целевых 33%. Рекомендуется учитывать это при ценообразовании.
              </p>
            </div>
          </div>
        </div>

        {/* Калькулятор оптимальных параметров */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-green-900 mb-4 flex items-center gap-2">
            🎯 Рекомендации для целевой доходности
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg border-2 border-green-300">
              <div className="text-sm text-gray-600 mb-1">Цель клиента</div>
              <div className="text-2xl font-bold text-green-700">33% ROI</div>
              <div className="text-xs text-gray-500 mt-1">С учётом роста сложности + роста BTC 10-15%</div>
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-blue-300">
              <div className="text-sm text-gray-600 mb-1">Наша прибыль от токенов</div>
              <div className="text-2xl font-bold text-blue-700">30-40%</div>
              <div className="text-xs text-gray-500 mt-1">Наценка на оборудование</div>
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-purple-300">
              <div className="text-sm text-gray-600 mb-1">Наша прибыль от ЭЭ</div>
              <div className="text-2xl font-bold text-purple-700">≥30%</div>
              <div className="text-xs text-gray-500 mt-1">С учётом налогов</div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg mb-4">
            <h3 className="font-bold text-gray-800 mb-2">💡 Текущие показатели:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Наценка на токены:</span>
                <span className={`ml-2 font-bold ${calculatedMargin >= 30 && calculatedMargin <= 40 ? 'text-green-600' : 'text-orange-600'}`}>
                  {calculatedMargin.toFixed(1)}% {calculatedMargin >= 30 && calculatedMargin <= 40 ? '✅' : '⚠️'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">ROI инвестора (год 1):</span>
                <span className={`ml-2 font-bold ${calculatedScenarios[0]?.investorROI >= 33 ? 'text-green-600' : 'text-orange-600'}`}>
                  {calculatedScenarios[0]?.investorROI.toFixed(1)}% {calculatedScenarios[0]?.investorROI >= 33 ? '✅' : '⚠️'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Маржа ЭЭ:</span>
                <span className={`ml-2 font-bold ${((clientCostEE - companyCostEE) / companyCostEE * 100) >= 30 ? 'text-green-600' : 'text-orange-600'}`}>
                  {((clientCostEE - companyCostEE) / companyCostEE * 100).toFixed(1)}% {((clientCostEE - companyCostEE) / companyCostEE * 100) >= 30 ? '✅' : '⚠️'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300">
            <h3 className="font-bold text-yellow-900 mb-2">📝 Рекомендации:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Для достижения ROI клиента 33% при росте сложности 47% нужен рост BTC минимум на 10-15% в год</li>
              <li>• При текущей цене BTC ${btcPriceNow.toLocaleString()} ROI составляет ~{calculatedScenarios[0]?.investorROI.toFixed(1)}%</li>
              <li>• Для компенсации роста сложности рекомендуется прогноз роста BTC до ${Math.round(btcPriceNow * 1.5).toLocaleString()} через 1-2 года</li>
              <li>• Срок жизни оборудования: 3 года - учитывайте снижение доходности каждый год на {difficultyGrowth}%</li>
            </ul>
          </div>
        </div>

        {/* Информация о росте сложности */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-4xl">⚠️</div>
            <div>
              <h3 className="text-xl font-bold text-orange-900 mb-2">
                Важно: Влияние роста сложности сети
              </h3>
              <p className="text-gray-700 mb-3">
                Сложность сети Bitcoin растёт со скоростью ~<strong>{difficultyGrowth}% в год</strong> (данные за ноя 2024 - окт 2025). 
                Это означает, что доходность майнинга для инвесторов снижается на тот же процент при неизменной цене BTC.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="text-sm text-gray-600">Год 1</div>
                  <div className="text-lg font-bold text-gray-900">
                    ROI: {calculatedScenarios[0]?.investorROI.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="text-sm text-gray-600">Год 2</div>
                  <div className="text-lg font-bold text-orange-700">
                    ROI: {((calculatedScenarios[0]?.investorROI || 0) * (1 - difficultyGrowth/100)).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-orange-200">
                  <div className="text-sm text-gray-600">Год 3</div>
                  <div className="text-lg font-bold text-red-700">
                    ROI: {((calculatedScenarios[0]?.investorROI || 0) * Math.pow(1 - difficultyGrowth/100, 2)).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Сравнительная таблица */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-8 overflow-x-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">📊 Сравнение сценариев</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                  <th className="px-4 py-3 text-left rounded-tl-lg">Параметр</th>
                  {calculatedScenarios.map((s, idx) => (
                    <th key={idx} className={`px-4 py-3 text-center ${idx === calculatedScenarios.length - 1 ? 'rounded-tr-lg' : ''}`}>
                      {s.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">Токенов</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center">{s.tokens.toLocaleString()}</td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">Асиков</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center">{s.asics}</td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">Мощность (TH)</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center">{s.totalTH.toLocaleString()}</td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50 bg-red-50">
                  <td className="px-4 py-3 font-semibold text-red-700">💸 Инвестиции</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center font-bold text-red-700">
                      ${s.totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">От продажи токенов</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center">
                      ${s.tokenSalesRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">От ЭЭ (год)</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center">
                      ${s.energyProfitPerYear.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50 bg-green-50">
                  <td className="px-4 py-3 font-semibold text-green-700">💰 Итого за год 1</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center font-bold text-green-700 text-lg">
                      ${s.totalRevenueYear1.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50 bg-blue-50">
                  <td className="px-4 py-3 font-semibold text-blue-700">🎯 ROI компании</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center font-bold text-blue-700 text-lg">
                      {s.companyROI.toFixed(1)}%
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">Доход инвестора (день)</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center">
                      ${s.investorDailyRevenue.toFixed(4)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold">Доход инвестора (год)</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center">
                      ${s.investorAnnualRevenue.toFixed(2)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50 bg-purple-50">
                  <td className="px-4 py-3 font-semibold text-purple-700">📈 ROI инвестора</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center font-bold text-purple-700">
                      {s.investorROI.toFixed(2)}% годовых
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-gray-50 bg-orange-50">
                  <td className="px-4 py-3 font-semibold text-orange-700">⏱️ Окупаемость</td>
                  {calculatedScenarios.map((s, idx) => (
                    <td key={idx} className="px-4 py-3 text-center font-bold text-orange-700">
                      {s.paybackYears.toFixed(2)} лет
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* График */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">📈 Динамика дохода компании (5 лет)</h2>
          
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorScenario0" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorScenario1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorScenario2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffc658" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ffc658" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip 
                formatter={(value) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="scenario0" 
                stroke="#8884d8" 
                fillOpacity={1} 
                fill="url(#colorScenario0)" 
                name={calculatedScenarios[0]?.name}
              />
              <Area 
                type="monotone" 
                dataKey="scenario1" 
                stroke="#82ca9d" 
                fillOpacity={1} 
                fill="url(#colorScenario1)" 
                name={calculatedScenarios[1]?.name}
              />
              <Area 
                type="monotone" 
                dataKey="scenario2" 
                stroke="#ffc658" 
                fillOpacity={1} 
                fill="url(#colorScenario2)" 
                name={calculatedScenarios[2]?.name}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Карточки с ключевыми метриками */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {calculatedScenarios.map((s, idx) => (
            <div key={idx} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-6 border-2 border-gray-200 hover:border-purple-400 transition-all">
              <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center justify-between">
                <span>{s.name}</span>
                <span className="text-3xl">
                  {idx === 0 ? '🥉' : idx === 1 ? '🥈' : '🥇'}
                </span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Мощность:</span>
                  <span className="font-bold text-lg">{s.totalTH.toLocaleString()} TH</span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Инвестиции:</span>
                  <span className="font-bold text-lg text-red-600">
                    ${s.totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-gray-600">Доход (год 1):</span>
                  <span className="font-bold text-lg text-green-600">
                    ${s.totalRevenueYear1.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pb-2 border-b bg-gradient-to-r from-purple-50 to-indigo-50 p-2 rounded-lg">
                  <span className="text-gray-700 font-semibold">ROI компании:</span>
                  <span className="font-bold text-xl text-purple-700">
                    {s.companyROI.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-cyan-50 p-2 rounded-lg">
                  <span className="text-gray-700 font-semibold">ROI инвестора:</span>
                  <span className="font-bold text-xl text-blue-700">
                    {s.investorROI.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Футер */}
        <div className="text-center text-white/80 mt-12">
          <p className="text-sm">
            💡 Калькулятор основан на текущих рыночных условиях. Фактические результаты могут отличаться.
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
