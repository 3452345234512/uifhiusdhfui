import { Link } from 'react-router-dom'

function DetailsPage({ 
  totalPoolTH,
  t21Count,
  s21Count,
  t21TH,
  s21TH,
  avgCostPerTH,
  tokenPrice,
  marginPercent,
  avgEfficiency,
  poolCalculation,
  clientCostEE,
  difficultyGrowth,
  btcPriceNow,
  miners,
  fleetT21Percent,
  fleetS21Percent
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      {/* Навигация */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-white hover:text-yellow-300 transition-colors"
          >
            <span className="text-2xl">←</span>
            <span className="font-semibold">Вернуться к калькулятору</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">📊 Детальный анализ проекта</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Суть проекта */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-2xl p-6">
          <h2 className="text-3xl font-bold text-blue-900 mb-6 flex items-center gap-2">
            🎯 Суть проекта HASH2CASH
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Для инвесторов */}
            <div className="bg-white p-6 rounded-xl border-2 border-green-200">
              <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                👤 Для инвесторов
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <div>
                    <div className="font-bold">Покупаете токены H2C</div>
                    <div className="text-gray-600">Каждый токен = 1 TH мощности в пуле</div>
                    <div className="text-purple-700 font-semibold">Цена: ${tokenPrice.toFixed(2)} за токен</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <div>
                    <div className="font-bold">Получаете долю от майнинга</div>
                    <div className="text-gray-600">Пропорционально количеству токенов</div>
                    <div className="text-green-700 font-semibold">${poolCalculation.investorAnnualRevenue.toFixed(2)}/год за токен</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <div>
                    <div className="font-bold">Платите только за электричество</div>
                    <div className="text-gray-600">По тарифу {clientCostEE}₽/кВт⋅ч (+10% наценка)</div>
                    <div className="text-red-700 font-semibold">${(poolCalculation.investorAnnualRevenue / (poolCalculation.investorROI / 100) * 365 - poolCalculation.investorAnnualRevenue).toFixed(2)}/год за токен</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <div>
                    <div className="font-bold">ROI: {poolCalculation.investorROI.toFixed(1)}% в год</div>
                    <div className="text-gray-600">При текущем курсе BTC ${btcPriceNow.toLocaleString()}</div>
                    <div className="text-blue-700 font-semibold">Окупаемость: {poolCalculation.paybackYears.toFixed(1)} лет</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold text-xl">⚠</span>
                  <div>
                    <div className="font-bold text-orange-900">РИСК: Рост сложности сети</div>
                    <div className="text-gray-600">Доходность снижается на {difficultyGrowth}% в год</div>
                    <div className="text-red-700 font-semibold">Через 3 года ROI: {(poolCalculation.investorROI * Math.pow(1 - difficultyGrowth/100, 2)).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Для владельцев проекта */}
            <div className="bg-white p-6 rounded-xl border-2 border-purple-200">
              <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                🏢 Для владельцев проекта
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold text-xl">✓</span>
                  <div>
                    <div className="font-bold">Покупаете оборудование</div>
                    <div className="text-gray-600">{t21Count + s21Count} асиков ({t21Count} T21 + {s21Count} S21 Pro)</div>
                    <div className="text-red-700 font-semibold">Инвестиции: ${poolCalculation.totalInvestment.toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold text-xl">✓</span>
                  <div>
                    <div className="font-bold">Продаете токены с наценкой {marginPercent}%</div>
                    <div className="text-gray-600">Себестоимость ${avgCostPerTH.toFixed(2)} → Продажа ${tokenPrice.toFixed(2)}</div>
                    <div className="text-green-700 font-semibold">Прибыль: ${poolCalculation.tokenSalesRevenue.toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold text-xl">✓</span>
                  <div>
                    <div className="font-bold">Продаете электричество с наценкой 10%</div>
                    <div className="text-gray-600">Стабильный доход каждый год</div>
                    <div className="text-green-700 font-semibold">${poolCalculation.energyProfitPerYear.toLocaleString()}/год</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold text-xl">✓</span>
                  <div>
                    <div className="font-bold">ROI компании: {poolCalculation.companyROI.toFixed(1)}%</div>
                    <div className="text-gray-600">В первый год (токены + ЭЭ)</div>
                    <div className="text-green-700 font-semibold">Доход: ${poolCalculation.totalRevenueYear1.toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold text-xl">✓</span>
                  <div>
                    <div className="font-bold text-green-900">Стабильный доход от ЭЭ</div>
                    <div className="text-gray-600">Пока работает оборудование (3+ лет)</div>
                    <div className="text-green-700 font-semibold">${poolCalculation.energyProfitPerYear.toLocaleString()}/год навсегда</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Сравнение с покупкой Bitcoin */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-6">
          <h2 className="text-3xl font-bold text-yellow-900 mb-6 flex items-center gap-2">
            ₿ Сравнение: Токены H2C vs Покупка Bitcoin
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Токены H2C */}
            <div className="bg-white p-6 rounded-xl border-2 border-green-200">
              <h3 className="text-2xl font-bold text-green-900 mb-4 flex items-center gap-2">
                🪙 Токены H2C
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Инвестиция:</span>
                  <span className="font-bold text-lg">${tokenPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="text-gray-600">Годовой доход:</span>
                  <span className="font-bold text-green-600 text-lg">${poolCalculation.investorAnnualRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                  <span className="text-gray-600">ROI год 1:</span>
                  <span className="font-bold text-green-600 text-lg">{poolCalculation.investorROI.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-gray-600">Окупаемость:</span>
                  <span className="font-bold text-lg">{poolCalculation.paybackYears.toFixed(1)} лет</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                  <span className="text-gray-600">Риск:</span>
                  <span className="font-bold text-orange-600">Высокий</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                  <span className="text-gray-600">ROI через 3 года:</span>
                  <span className="font-bold text-red-600 text-lg">{(poolCalculation.investorROI * Math.pow(1 - difficultyGrowth/100, 2)).toFixed(1)}%</span>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="font-bold text-blue-900 mb-1">💡 Плюсы:</div>
                  <ul className="text-xs space-y-1 text-gray-700">
                    <li>• Стабильный доход от майнинга</li>
                    <li>• Не нужно покупать оборудование</li>
                    <li>• Профессиональное обслуживание</li>
                  </ul>
                </div>
                <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="font-bold text-red-900 mb-1">⚠️ Минусы:</div>
                  <ul className="text-xs space-y-1 text-gray-700">
                    <li>• Снижение доходности {difficultyGrowth}%/год</li>
                    <li>• Зависимость от курса BTC</li>
                    <li>• Износ оборудования через 3 года</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Покупка Bitcoin */}
            <div className="bg-white p-6 rounded-xl border-2 border-orange-200">
              <h3 className="text-2xl font-bold text-orange-900 mb-4 flex items-center gap-2">
                ₿ Покупка Bitcoin
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Инвестиция:</span>
                  <span className="font-bold text-lg">${tokenPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Годовой доход:</span>
                  <span className="font-bold text-gray-400 text-lg">$0</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">ROI:</span>
                  <span className="font-bold text-orange-600 text-lg">Зависит от роста</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-gray-600">Окупаемость:</span>
                  <span className="font-bold text-lg">∞</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                  <span className="text-gray-600">Риск:</span>
                  <span className="font-bold text-orange-600">Средний</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="text-gray-600">Если BTC +50% за 3 года:</span>
                  <span className="font-bold text-blue-600 text-lg">+50%</span>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="font-bold text-blue-900 mb-1">💡 Плюсы:</div>
                  <ul className="text-xs space-y-1 text-gray-700">
                    <li>• Простота покупки</li>
                    <li>• Высокая ликвидность</li>
                    <li>• Возможность большого роста</li>
                  </ul>
                </div>
                <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="font-bold text-red-900 mb-1">⚠️ Минусы:</div>
                  <ul className="text-xs space-y-1 text-gray-700">
                    <li>• Нет пассивного дохода</li>
                    <li>• Высокая волатильность</li>
                    <li>• Может упасть в цене</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-white rounded-lg border-2 border-blue-300">
            <h4 className="font-bold text-blue-900 mb-3 text-lg">📊 Выводы:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-bold text-green-900 mb-2">✅ H2C токены выгоднее если:</div>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• BTC растет медленнее {difficultyGrowth}% в год</li>
                  <li>• Нужен стабильный пассивный доход</li>
                  <li>• Горизонт инвестирования 1-2 года</li>
                </ul>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="font-bold text-orange-900 mb-2">✅ Bitcoin выгоднее если:</div>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• BTC растет быстрее {difficultyGrowth}% в год</li>
                  <li>• Нужна высокая ликвидность</li>
                  <li>• Горизонт инвестирования 5+ лет</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Ключевые преимущества */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-2xl p-6">
          <h2 className="text-3xl font-bold text-emerald-900 mb-6 flex items-center gap-2">
            ⭐ Ключевые преимущества HASH2CASH
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border-2 border-emerald-200 hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="font-bold text-emerald-900 mb-3 text-lg">Простота инвестирования</h3>
              <p className="text-sm text-gray-600 mb-3">
                Покупаете токены - получаете долю в майнинге. Не нужно разбираться в оборудовании, настройке и обслуживании.
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <div>• Онлайн покупка токенов</div>
                <div>• Автоматические выплаты</div>
                <div>• Прозрачная статистика</div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border-2 border-blue-200 hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="font-bold text-blue-900 mb-3 text-lg">Лучшее оборудование</h3>
              <p className="text-sm text-gray-600 mb-3">
                T21 190TH и S21 Pro - самые эффективные асики на рынке с эффективностью {avgEfficiency.toFixed(1)} Вт/TH.
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <div>• Новейшие чипы 2024-2025</div>
                <div>• Минимальное энергопотребление</div>
                <div>• Профессиональное охлаждение</div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl border-2 border-purple-200 hover:shadow-lg transition-shadow">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="font-bold text-purple-900 mb-3 text-lg">Прозрачность</h3>
              <p className="text-sm text-gray-600 mb-3">
                Все расчеты открыты. Видите точно, сколько зарабатываете и сколько тратите на электричество.
              </p>
              <div className="text-xs text-gray-500 space-y-1">
                <div>• Открытый калькулятор</div>
                <div>• Детальные отчеты</div>
                <div>• Реальные данные сети</div>
              </div>
            </div>
          </div>
        </div>

        {/* Риски и ограничения */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-2xl p-6">
          <h2 className="text-3xl font-bold text-red-900 mb-6 flex items-center gap-2">
            ⚠️ Риски и ограничения
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border-2 border-red-200">
              <h3 className="font-bold text-red-900 mb-4 text-xl">📉 Основные риски</h3>
              <ul className="text-sm text-gray-700 space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <div>
                    <div className="font-bold">Рост сложности сети: {difficultyGrowth}% в год</div>
                    <div className="text-gray-600">Доходность падает каждый год. Через 3 года ROI снизится до {(poolCalculation.investorROI * Math.pow(1 - difficultyGrowth/100, 2)).toFixed(1)}%</div>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <div>
                    <div className="font-bold">Падение курса BTC</div>
                    <div className="text-gray-600">Напрямую влияет на доходы. При снижении BTC на 20%, доход упадет на 20%</div>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <div>
                    <div className="font-bold">Износ оборудования</div>
                    <div className="text-gray-600">Эффективность падает через 3 года, оборудование устаревает</div>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">•</span>
                  <div>
                    <div className="font-bold">Рост тарифов на ЭЭ</div>
                    <div className="text-gray-600">Может снизить прибыльность на 10-30% при повышении тарифов</div>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-xl border-2 border-orange-200">
              <h3 className="font-bold text-orange-900 mb-4 text-xl">🔒 Ограничения</h3>
              <ul className="text-sm text-gray-700 space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">•</span>
                  <div>
                    <div className="font-bold">Минимальная инвестиция: ${tokenPrice.toFixed(2)}</div>
                    <div className="text-gray-600">1 токен = 1 TH. Для ощутимого дохода нужно 10+ токенов</div>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">•</span>
                  <div>
                    <div className="font-bold">Срок жизни токена: 3 года</div>
                    <div className="text-gray-600">Пока работает оборудование. После нужно обновление парка</div>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">•</span>
                  <div>
                    <div className="font-bold">Невозможность выхода</div>
                    <div className="text-gray-600">Токены не торгуются на биржах, нет ликвидности</div>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 font-bold">•</span>
                  <div>
                    <div className="font-bold">Зависимость от компании</div>
                    <div className="text-gray-600">Успех зависит от профессионализма управления пулом</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-300 rounded-2xl p-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            ❓ Часто задаваемые вопросы
          </h2>
          
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
              <h3 className="font-bold text-gray-900 mb-2 text-lg">❓ Как работает майнинг-пул?</h3>
              <p className="text-sm text-gray-600 mb-2">
                Мы объединяем мощности всех асиков ({totalPoolTH.toLocaleString()} TH) в один пул. 
                Когда пул находит блок, награда распределяется пропорционально мощности каждого токена.
              </p>
              <div className="text-xs text-gray-500 mt-2 p-2 bg-blue-50 rounded">
                <strong>Пример:</strong> Если у вас 10 токенов из {totalPoolTH.toLocaleString()}, вы получаете {(10 / totalPoolTH * 100).toFixed(4)}% от каждого найденного блока.
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
              <h3 className="font-bold text-gray-900 mb-2 text-lg">❓ Почему доходность снижается?</h3>
              <p className="text-sm text-gray-600 mb-2">
                Сложность сети Bitcoin растет на {difficultyGrowth}% в год (исторические данные). 
                Это означает, что для нахождения блока нужно больше вычислительной мощности, 
                поэтому доля каждого TH уменьшается.
              </p>
              <div className="text-xs text-gray-500 mt-2 p-2 bg-orange-50 rounded">
                <strong>Динамика:</strong> Год 1: {poolCalculation.investorROI.toFixed(1)}% → Год 2: {(poolCalculation.investorROI * (1 - difficultyGrowth/100)).toFixed(1)}% → Год 3: {(poolCalculation.investorROI * Math.pow(1 - difficultyGrowth/100, 2)).toFixed(1)}%
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
              <h3 className="font-bold text-gray-900 mb-2 text-lg">❓ Что происходит с токенами через 3 года?</h3>
              <p className="text-sm text-gray-600 mb-2">
                Оборудование устаревает и становится неэффективным. Мы планируем обновление парка 
                и выпуск новых токенов для нового оборудования. Владельцы старых токенов получат 
                приоритет при обмене на новые.
              </p>
              <div className="text-xs text-gray-500 mt-2 p-2 bg-green-50 rounded">
                <strong>План:</strong> Через 3 года - обновление оборудования → новые токены → обмен 1:1 для существующих инвесторов
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
              <h3 className="font-bold text-gray-900 mb-2 text-lg">❓ Как часто выплачиваются доходы?</h3>
              <p className="text-sm text-gray-600 mb-2">
                Доходы от майнинга начисляются ежедневно и выплачиваются еженедельно. 
                Счет за электричество выставляется ежемесячно.
              </p>
              <div className="text-xs text-gray-500 mt-2 p-2 bg-blue-50 rounded">
                <strong>График выплат:</strong> Понедельник - начисление за неделю, Вторник - выплата на счет
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
              <h3 className="font-bold text-gray-900 mb-2 text-lg">❓ Можно ли продать токены досрочно?</h3>
              <p className="text-sm text-gray-600 mb-2">
                Токены не торгуются на биржах, но можно продать их другому инвестору напрямую. 
                Мы предоставляем доску объявлений для поиска покупателей, но не гарантируем ликвидность.
              </p>
              <div className="text-xs text-gray-500 mt-2 p-2 bg-yellow-50 rounded">
                <strong>Важно:</strong> Это долгосрочная инвестиция. Рассчитывайте на весь срок жизни оборудования (3 года)
              </div>
            </div>
          </div>
        </div>

        {/* Рекомендации */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-2xl p-6">
          <h2 className="text-3xl font-bold text-blue-900 mb-6 flex items-center gap-2">
            💡 Наши рекомендации
          </h2>
          
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border-2 border-green-300">
              <h3 className="font-bold text-green-900 mb-3 text-xl">✅ Для инвесторов</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">1.</span>
                  <div>
                    <strong>Инвестируйте только свободные средства</strong> - это высокорискованная инвестиция с горизонтом 3 года
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">2.</span>
                  <div>
                    <strong>Начните с малого</strong> - купите 5-10 токенов для тестирования, прежде чем вкладывать крупные суммы
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">3.</span>
                  <div>
                    <strong>Следите за курсом BTC</strong> - ваша доходность напрямую зависит от цены Bitcoin
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">4.</span>
                  <div>
                    <strong>Реинвестируйте прибыль</strong> - покупайте новые токены на доходы для роста портфеля
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-5 rounded-xl border-2 border-purple-300">
              <h3 className="font-bold text-purple-900 mb-3 text-xl">✅ Для владельцев проекта</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">1.</span>
                  <div>
                    <strong>Оптимизируйте наценку</strong> - текущая наценка {marginPercent}% оптимальна для привлечения инвесторов
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">2.</span>
                  <div>
                    <strong>Диверсифицируйте оборудование</strong> - текущий микс {fleetT21Percent}% T21 / {fleetS21Percent}% S21 Pro хорошо сбалансирован
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">3.</span>
                  <div>
                    <strong>Планируйте обновление парка</strong> - начинайте подготовку за 6 месяцев до окончания срока жизни
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600">4.</span>
                  <div>
                    <strong>Контролируйте расходы на ЭЭ</strong> - рост тарифов может снизить маржу с электричества
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default DetailsPage

