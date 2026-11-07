import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getCatalog, type Catalog, type Model } from './api'

type State = { catalog?: Catalog; error?: string }
const Ctx = createContext<State>({})

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({})
  useEffect(() => {
    getCatalog()
      .then((catalog) => setState({ catalog }))
      .catch((e: Error) => setState({ error: e.message }))
  }, [])
  return <Ctx.Provider value={state}>{children}</Ctx.Provider>
}

export const useCatalog = () => useContext(Ctx)

export function useModels(task: string): Model[] {
  return useCatalog().catalog?.models.filter((m) => m.task === task) ?? []
}
