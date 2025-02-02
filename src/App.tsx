import React, { useEffect, useState } from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Sider from '@/components/Sider'
import { MENUS } from '@/constants/elements'
import { listenEsc, managePluginTheme } from '@/util/util'
import { useAtom } from 'jotai'
import { projectSchedulesAtom, subscriptionSchedulesAtom } from '@/model/schedule'
import { getSchedules } from '@/util/schedule'
import { getInitalSettings } from '@/util/baseInfo'
import { getSubCalendarSchedules } from '@/util/subscription'
import { DEFAULT_SETTINGS } from '@/util/constants'

const App: React.FC<{}> = () => {

  // TODO: 使用 only-write 减少重新渲染
  const [, setProjectSchedules] = useAtom(projectSchedulesAtom)
  const [, setSubscriptionSchedules] = useAtom(subscriptionSchedulesAtom)

  const { homePage = DEFAULT_SETTINGS.homePage } = getInitalSettings()
  const homePageElement = MENUS.find(item => item.value === homePage)?.element

  useEffect(() => {
    async function fetchSchedules() {
      setProjectSchedules(await getSchedules())
      const { subscriptionList } = getInitalSettings()
      setSubscriptionSchedules(await getSubCalendarSchedules(subscriptionList))
    }
    fetchSchedules()
    managePluginTheme()
  }, [])

  useEffect(() => {
    const callback = () => logseq.hideMainUI()
    listenEsc(callback)
    return () => {
      document.removeEventListener('keyup', callback)
    }
  }, [])

  return (
    <main className="w-screen h-screen flex" prefix="custom">
      <MemoryRouter>
        <Sider />
        <Routes>
          <Route path="/" element={homePageElement} />
          {
            MENUS.map(item => (
              <Route path={item.path} element={item.element} key={item.value} />
            ))
          }
        </Routes>
      </MemoryRouter>
    </main>
  )
}

export default App
