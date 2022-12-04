import { useContext, createContext, useState } from 'react'

const WebsiteUrlContext = createContext({})
export const WebsiteUrlContextProvider = ({ children }) => {
  const [websiteUrl, setWebsiteUrl] = useState('')
  const varWebsiteUrl = (newVal?: any) => {
    if (typeof newVal == 'undefined') {
      return websiteUrl
    } else {
      setWebsiteUrl(newVal)
    }
  }

  return (
    <WebsiteUrlContext.Provider value={{ varWebsiteUrl, websiteUrl }}>
      {children}
    </WebsiteUrlContext.Provider>
  )
}

export const useWebsiteUrl: any = () => {
  return useContext(WebsiteUrlContext)
}
