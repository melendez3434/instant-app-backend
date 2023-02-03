import { makeVar, useReactiveVar } from '@apollo/client'
import { getCache, setCache } from '../../utlis/cacheService'

const initState: any =
  // getCache("Previewer") ||
  {
    id: null,
  }

const previewer = makeVar({ ...initState, loading: true })
export const varPreviewer = (newVal?: any, reset?: any) => {
  if (reset) {
    setCache('previewer', { ...initState, ...newVal })
    return previewer({ ...initState, ...newVal })
  }
  if (typeof newVal !== 'undefined') {
    setCache('previewer', newVal)
    return previewer(newVal)
  }
  return previewer()
}

export const useVarPreviewer = () => {
  const newData = useReactiveVar(previewer)

  return {
    ...newData,
  }
}

export const setPreviewerDefaults = async () => {
  const previewerCache = await getCache('previewer')

  previewer({ ...(previewerCache || initState), loading: false })
}
setPreviewerDefaults()
