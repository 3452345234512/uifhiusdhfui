import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './App.css'

function MixedPool() {
  // КЛЮЧЕВЫЕ ВВОДНЫЕ ПАРАМЕТРЫ
  
  // 1. Электроэнергия
  const [companyCostEE, setCompanyCostEE] = useState(5.4) // Себестоимость ЭЭ (₽/кВт⋅ч)
  const [clientCostEE, setClientCostEE] = useState(6.2) // Продажа ЭЭ клиенту (₽/кВт⋅ч)
  
  // 2. Количество оборудования
  const [l9Count, setL9Count] = useState(10) // Количество Antminer L9
  const [s21Count, setS21Count] = useState(10) // Количество Antminer S21 Pro
  const [marginPercent, setMarginPercent] = useState(30) // Наценка компании на токены (%)
  
  // 3. Курсы криптовалют
  const [btcPriceNow, setBtcPriceNow] = useState(106497) // Курс BTC ($)
  const [ltcPriceNow, setLtcPriceNow] = useState(95.43) // Курс LTC ($)
  const [dogePriceNow, setDogePriceNow] = useState(0.2027) // Курс DOGE ($)
  
  // 4. Доходность оборудования
  const [btcPerTHPerDay, setBtcPerTHPerDay] = useState(0.00000043) // BTC за TH в день
  const [ltcPerMHPerDay, setLtcPerMHPerDay] = useState(0.01891239 / 16000) // LTC за MH/s в день
  const [dogePerMHPerDay, setDogePerMHPerDay] = useState(64.72873183 / 16000) // DOGE за MH/s в день

  // Вспомогательные константы
  const usdtRate = 82 // Курс USDT к рублю
  const difficultyGrowth = 40 // Средний рост сложности для микса BTC+LTC

  // Параметры оборудования
  const miners = {
    'L9': {
      name: 'Antminer L9',
      hashrate: 16000, // MH/s
      power: 3360, // Вт
      price: 5250, // USD
      efficiency: 0.21, // Вт/MH
      type: 'LTC+DOGE'
    },
    'S21Pro': {
      name: 'Antminer S21 Pro',
      hashrate: 245, // TH/s
      power: 3675, // Вт
      price: 3900, // USD
      efficiency: 15, // Вт/TH
      type: 'BTC'
    }
  }

  // РАСЧЁТ ПОКАЗАТЕЛЕЙ ПУЛА
  const poolCalculations = useMemo(() => {
    // Мощности
    const totalL9MH = l9Count * miners.L9.hashrate
    const totalS21TH = s21Count * miners.S21Pro.hashrate
    
    // Потребление
    const l9PowerWatts = l9Count * miners.L9.power
    const s21PowerWatts = s21Count * miners.S21Pro.power
    const totalPowerWatts = l9PowerWatts + s21PowerWatts
    const totalPowerMW = totalPowerWatts / 1000000
    
    // Себестоимость
    const l9CostTotal = l9Count * miners.L9.price
    const s21CostTotal = s21Count * miners.S21Pro.price
    const totalInvestment = l9CostTotal + s21CostTotal
    
    return {
      totalL9MH,
      totalS21TH,
      l9PowerWatts,
      s21PowerWatts,
      totalPowerWatts,
      totalPowerMW,
      l9CostTotal,
      s21CostTotal,
      totalInvestment
    }
  }, [l9Count, s21Count])

  const { totalL9MH, totalS21TH, l9PowerWatts, s21PowerWatts, totalPowerWatts, totalPowerMW, l9CostTotal, s21CostTotal, totalInvestment } = poolCalculations

  // Энергопотребление
  const l9EnergyPerMH = (miners.L9.efficiency * 24) / 1000 // кВт/день на MH
  const s21EnergyPerTH = (miners.S21Pro.efficiency * 1.1 * 24) / 1000 // кВт/день на TH
  
  // Затраты на ЭЭ
  const companyCostPerKwhL9 = (companyCostEE / usdtRate) * l9EnergyPerMH
  const clientCostPerKwhL9 = (clientCostEE / usdtRate) * l9EnergyPerMH * 1.1
  
  const companyCostPerKwhS21 = (companyCostEE / usdtRate) * s21EnergyPerTH
  const clientCostPerKwhS21 = (clientCostEE / usdtRate) * s21EnergyPerTH * 1.1
  
  // Доходы от майнинга
  const l9MiningRevenuePerMH = (ltcPerMHPerDay * ltcPriceNow) + (dogePerMHPerDay * dogePriceNow)
  const s21MiningRevenuePerTH = btcPerTHPerDay * btcPriceNow
  
  // Расчет для L9 части
  const l9Calculations = useMemo(() => {
    const costPerMH = miners.L9.price / miners.L9.hashrate
    const tokenPriceL9 = costPerMH * (1 + marginPercent / 100)
    const tokenSalesRevenue = totalL9MH * (tokenPriceL9 - costPerMH)
    const energyProfitPerYear = totalL9MH * (clientCostPerKwhL9 - companyCostPerKwhL9) * 365
    
    const investorDailyRevenue = l9MiningRevenuePerMH - clientCostPerKwhL9
    const investorAnnualRevenue = investorDailyRevenue * 365
    const investorROI = (investorAnnualRevenue / tokenPriceL9) * 100
    
    return {
      costPerMH,
      tokenPriceL9,
      tokenSalesRevenue,
      energyProfitPerYear,
      investorDailyRevenue,
      investorAnnualRevenue,
      investorROI
    }
  }, [totalL9MH, marginPercent, l9MiningRevenuePerMH, clientCostPerKwhL9, companyCostPerKwhL9])

  // Расчет для S21 части
  const s21Calculations = useMemo(() => {
    const costPerTH = miners.S21Pro.price / miners.S21Pro.hashrate
    const tokenPriceS21 = costPerTH * (1 + marginPercent / 100)
    const tokenSalesRevenue = totalS21TH * (tokenPriceS21 - costPerTH)
    const energyProfitPerYear = totalS21TH * (clientCostPerKwhS21 - companyCostPerKwhS21) * 365
    
    const investorDailyRevenue = s21MiningRevenuePerTH - clientCostPerKwhS21
    const investorAnnualRevenue = investorDailyRevenue * 365
    const investorROI = (investorAnnualRevenue / tokenPriceS21) * 100
    
    return {
      costPerTH,
      tokenPriceS21,
      tokenSalesRevenue,
      energyProfitPerYear,
      investorDailyRevenue,
      investorAnnualRevenue,
      investorROI
    }
  }, [totalS21TH, marginPercent, s21MiningRevenuePerTH, clientCostPerKwhS21, companyCostPerKwhS21])

  // Общие показатели пула
  const totalRevenue = l9Calculations.tokenSalesRevenue + s21Calculations.tokenSalesRevenue + 
                        l9Calculations.energyProfitPerYear + s21Calculations.energyProfitPerYear
  const companyROI = (totalRevenue / totalInvestment) * 100

  // Средний ROI инвестора (взвешенный)
  const totalTokens = totalL9MH + totalS21TH
  const avgInvestorROI = ((l9Calculations.investorROI * totalL9MH) + (s21Calculations.investorROI * totalS21TH)) / totalTokens

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 pb-20">
      {/* Заголовок */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white py-8 shadow-2xl mb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <span className="text-5xl">🔀</span> HASH2CASH Mixed Pool
              </h1>
              <p className="text-purple-100 text-lg">
                Микс оборудования: L9 (LTC+DOGE) + S21 Pro (BTC) - диверсификация рисков
              </p>
            </div>
            <div className="flex gap-4">
              <Link 
                to="/" 
                className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
              >
                ₿ Bitcoin Pool
              </Link>
              <Link 
                to="/litecoin" 
                className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
              >
                🪙 Litecoin Pool
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Закрепленная панель статистики */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 shadow-2xl mb-8">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center mb-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="text-white/70 text-xs font-semibold">L9 Асиков</div>
              <div className="text-white font-bold text-lg">{l9Count}</div>
              <div className="text-white/60 text-xs mt-1">{totalL9MH.toLocaleString()} MH/s</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="text-white/70 text-xs font-semibold">S21 Асиков</div>
              <div className="text-white font-bold text-lg">{s21Count}</div>
              <div className="text-white/60 text-xs mt-1">{totalS21TH.toLocaleString()} TH/s</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="text-white/70 text-xs font-semibold">Потребление</div>
              <div className="text-white font-bold text-lg">{totalPowerMW.toFixed(2)} МВт</div>
              <div className="text-white/60 text-xs mt-1">{totalPowerWatts.toLocaleString()}W</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="text-white/70 text-xs font-semibold">Инвестиции</div>
              <div className="text-white font-bold text-lg">${(totalInvestment/1000).toFixed(0)}k</div>
              <div className="text-white/60 text-xs mt-1">${totalInvestment.toLocaleString()}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="text-white/70 text-xs font-semibold">ROI Компании</div>
              <div className="text-white font-bold text-lg">{companyROI.toFixed(1)}%</div>
              <div className="text-white/60 text-xs mt-1">Год 1</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="text-white/70 text-xs font-semibold">ROI Инвестора</div>
              <div className="text-white font-bold text-lg">{avgInvestorROI.toFixed(1)}%</div>
              <div className="text-white/60 text-xs mt-1">Средний</div>
            </div>
          </div>
          
          {/* Ползунок наценки */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3">
            <div className="flex items-center gap-4">
              <span className="text-white font-semibold text-sm whitespace-nowrap">💰 Наценка на токены:</span>
              <div className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={marginPercent}
                  onChange={(e) => setMarginPercent(parseInt(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${marginPercent}%, #e5e7eb ${marginPercent}%, #e5e7eb 100%)`
                  }}
                />
                <div className="text-xs text-white/90 mt-1">
                  {marginPercent}% наценка
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="space-y-6">
          
          {/* Настройка количества оборудования */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-purple-500">🖥️</span> Настройка оборудования
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-cyan-50 p-4 rounded-lg border-2 border-cyan-300">
                <label className="block text-sm font-semibold text-cyan-700 mb-2">
                  🪙 Количество Antminer L9 (LTC+DOGE)
                </label>
                <input
                  type="number"
                  value={l9Count}
                  onChange={(e) => setL9Count(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-4 py-2 text-2xl font-bold border-2 border-cyan-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <div className="text-xs text-gray-600 mt-1">
                  Мощность: {totalL9MH.toLocaleString()} MH/s | Потребление: {(l9PowerWatts/1000).toFixed(1)} кВт
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-300">
                <label className="block text-sm font-semibold text-orange-700 mb-2">
                  ₿ Количество Antminer S21 Pro (BTC)
                </label>
                <input
                  type="number"
                  value={s21Count}
                  onChange={(e) => setS21Count(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-4 py-2 text-2xl font-bold border-2 border-orange-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <div className="text-xs text-gray-600 mt-1">
                  Мощность: {totalS21TH.toLocaleString()} TH/s | Потребление: {(s21PowerWatts/1000).toFixed(1)} кВт
                </div>
              </div>
            </div>
          </div>

          {/* 1. ЭЛЕКТРОЭНЕРГИЯ */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-yellow-500">⚡</span> 1. Электроэнергия
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
                <label className="block text-sm font-semibold text-yellow-700 mb-2">
                  Себестоимость ЭЭ (₽/кВт⋅ч)
                </label>
                <input
                  type="number"
                  value={companyCostEE}
                  onChange={(e) => setCompanyCostEE(parseFloat(e.target.value))}
                  step="0.1"
                  className="w-full px-4 py-2 text-2xl font-bold border-2 border-yellow-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <div className="text-xs text-gray-600 mt-1">
                  Стоимость для компании
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                <label className="block text-sm font-semibold text-green-700 mb-2">
                  Продажа ЭЭ клиенту (₽/кВт⋅ч)
                </label>
                <input
                  type="number"
                  value={clientCostEE}
                  onChange={(e) => setClientCostEE(parseFloat(e.target.value))}
                  step="0.1"
                  className="w-full px-4 py-2 text-2xl font-bold border-2 border-green-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="text-xs text-gray-600 mt-1">
                  С наценкой 10%: {((clientCostEE - companyCostEE) / companyCostEE * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Сводная таблица доходов */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">💰 Сводная таблица доходов и ROI</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <tr>
                    <th className="p-3 text-left">Оборудование</th>
                    <th className="p-3 text-center">Количество</th>
                    <th className="p-3 text-center">Инвестиции</th>
                    <th className="p-3 text-center">Доход от токенов</th>
                    <th className="p-3 text-center">Доход от ЭЭ/год</th>
                    <th className="p-3 text-center">ROI инвестора</th>
                    <th className="p-3 text-center">Доход инвестора/год</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="bg-cyan-50 hover:bg-cyan-100">
                    <td className="p-3 font-semibold">
                      <div>Antminer L9</div>
                      <div className="text-xs text-gray-500">LTC+DOGE Mining</div>
                    </td>
                    <td className="p-3 text-center font-bold">{l9Count} шт</td>
                    <td className="p-3 text-center">${l9CostTotal.toLocaleString()}</td>
                    <td className="p-3 text-center text-green-600 font-bold">${l9Calculations.tokenSalesRevenue.toLocaleString()}</td>
                    <td className="p-3 text-center text-blue-600 font-bold">${l9Calculations.energyProfitPerYear.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-xl text-cyan-700">{l9Calculations.investorROI.toFixed(1)}%</span>
                    </td>
                    <td className="p-3 text-center font-bold">${l9Calculations.investorAnnualRevenue.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-orange-50 hover:bg-orange-100">
                    <td className="p-3 font-semibold">
                      <div>Antminer S21 Pro</div>
                      <div className="text-xs text-gray-500">Bitcoin Mining</div>
                    </td>
                    <td className="p-3 text-center font-bold">{s21Count} шт</td>
                    <td className="p-3 text-center">${s21CostTotal.toLocaleString()}</td>
                    <td className="p-3 text-center text-green-600 font-bold">${s21Calculations.tokenSalesRevenue.toLocaleString()}</td>
                    <td className="p-3 text-center text-blue-600 font-bold">${s21Calculations.energyProfitPerYear.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-xl text-orange-700">{s21Calculations.investorROI.toFixed(1)}%</span>
                    </td>
                    <td className="p-3 text-center font-bold">${s21Calculations.investorAnnualRevenue.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-purple-100 font-bold text-lg">
                    <td className="p-3">ИТОГО</td>
                    <td className="p-3 text-center">{l9Count + s21Count} шт</td>
                    <td className="p-3 text-center text-red-700">${totalInvestment.toLocaleString()}</td>
                    <td className="p-3 text-center text-green-700">${(l9Calculations.tokenSalesRevenue + s21Calculations.tokenSalesRevenue).toLocaleString()}</td>
                    <td className="p-3 text-center text-blue-700">${(l9Calculations.energyProfitPerYear + s21Calculations.energyProfitPerYear).toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <span className="text-2xl text-purple-700">{avgInvestorROI.toFixed(1)}%</span>
                    </td>
                    <td className="p-3 text-center text-purple-700">${((l9Calculations.investorAnnualRevenue * totalL9MH) + (s21Calculations.investorAnnualRevenue * totalS21TH)).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ROI компании */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">🏢 ROI компании (год 1)</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
                <div className="text-sm text-gray-600 mb-1">Инвестиции</div>
                <div className="text-3xl font-bold text-red-700">${totalInvestment.toLocaleString()}</div>
                <div className="text-xs text-gray-500">L9: ${l9CostTotal.toLocaleString()} + S21: ${s21CostTotal.toLocaleString()}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                <div className="text-sm text-gray-600 mb-1">Доход от токенов</div>
                <div className="text-3xl font-bold text-green-700">${(l9Calculations.tokenSalesRevenue + s21Calculations.tokenSalesRevenue).toLocaleString()}</div>
                <div className="text-xs text-gray-500">Единовременно</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                <div className="text-sm text-gray-600 mb-1">Доход от ЭЭ</div>
                <div className="text-3xl font-bold text-blue-700">${(l9Calculations.energyProfitPerYear + s21Calculations.energyProfitPerYear).toLocaleString()}</div>
                <div className="text-xs text-gray-500">Ежегодно</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-300">
                <div className="text-sm text-gray-600 mb-1">ROI компании</div>
                <div className="text-4xl font-bold text-purple-700">{companyROI.toFixed(1)}%</div>
                <div className="text-xs text-gray-500">= ${totalRevenue.toLocaleString()} ÷ ${totalInvestment.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Детальная разбивка по оборудованию */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* L9 блок */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl shadow-2xl p-6 border-2 border-cyan-300">
              <h3 className="text-xl font-bold text-cyan-900 mb-4">🪙 Antminer L9 (LTC+DOGE)</h3>
              
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Количество:</span>
                    <span className="font-bold">{l9Count} шт</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Мощность:</span>
                    <span className="font-bold">{totalL9MH.toLocaleString()} MH/s</span>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-lg">
                  <div className="font-semibold text-cyan-900 mb-2">💰 Финансы компании:</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Инвестиции:</span>
                    <span className="font-bold text-red-700">${l9CostTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Доход (токены):</span>
                    <span className="font-bold text-green-700">${l9Calculations.tokenSalesRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Доход (ЭЭ/год):</span>
                    <span className="font-bold text-blue-700">${l9Calculations.energyProfitPerYear.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-lg">
                  <div className="font-semibold text-cyan-900 mb-2">👤 Инвестор:</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Цена токена:</span>
                    <span className="font-bold">${l9Calculations.tokenPriceL9.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Доход/год:</span>
                    <span className="font-bold text-green-700">${l9Calculations.investorAnnualRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ROI:</span>
                    <span className="font-bold text-xl text-cyan-700">{l9Calculations.investorROI.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* S21 блок */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl shadow-2xl p-6 border-2 border-orange-300">
              <h3 className="text-xl font-bold text-orange-900 mb-4">₿ Antminer S21 Pro (BTC)</h3>
              
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-lg">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Количество:</span>
                    <span className="font-bold">{s21Count} шт</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Мощность:</span>
                    <span className="font-bold">{totalS21TH.toLocaleString()} TH/s</span>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-lg">
                  <div className="font-semibold text-orange-900 mb-2">💰 Финансы компании:</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Инвестиции:</span>
                    <span className="font-bold text-red-700">${s21CostTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Доход (токены):</span>
                    <span className="font-bold text-green-700">${s21Calculations.tokenSalesRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Доход (ЭЭ/год):</span>
                    <span className="font-bold text-blue-700">${s21Calculations.energyProfitPerYear.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-lg">
                  <div className="font-semibold text-orange-900 mb-2">👤 Инвестор:</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Цена токена:</span>
                    <span className="font-bold">${s21Calculations.tokenPriceS21.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Доход/год:</span>
                    <span className="font-bold text-green-700">${s21Calculations.investorAnnualRevenue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">ROI:</span>
                    <span className="font-bold text-xl text-orange-700">{s21Calculations.investorROI.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Преимущества микса */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-2xl p-6 border-2 border-green-300">
            <h2 className="text-2xl font-bold mb-4 text-green-900">⭐ Преимущества диверсификации</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <div className="text-3xl mb-2">🛡️</div>
                <h3 className="font-bold text-gray-800 mb-2">Снижение рисков</h3>
                <p className="text-sm text-gray-600">
                  Если падает BTC, выручает LTC+DOGE. Если падает LTC - выручает BTC.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-bold text-gray-800 mb-2">Разная динамика</h3>
                <p className="text-sm text-gray-600">
                  BTC растет сложность {difficultyGrowth}%/год, LTC - 30%/год. Микс снижает общий риск.
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <div className="text-3xl mb-2">💎</div>
                <h3 className="font-bold text-gray-800 mb-2">3 монеты в 1</h3>
                <p className="text-sm text-gray-600">
                  BTC + LTC + DOGE. Диверсификация по 3 монетам одновременно.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* Кнопки навигации */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
        <Link 
          to="/" 
          className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-yellow-600 text-white px-6 py-4 rounded-full font-bold shadow-2xl hover:from-orange-600 hover:to-yellow-700 transition-all transform hover:scale-105"
        >
          <span className="text-2xl">₿</span>
          <span>Bitcoin Pool</span>
        </Link>
        <Link 
          to="/litecoin" 
          className="flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-4 rounded-full font-bold shadow-2xl hover:from-cyan-600 hover:to-blue-700 transition-all transform hover:scale-105"
        >
          <span className="text-2xl">🪙</span>
          <span>Litecoin Pool</span>
        </Link>
      </div>
    </div>
  )
}

export default MixedPool





