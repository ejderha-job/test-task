import { useCallback, useEffect, useState, type DependencyList } from 'react'

type State<T> = { data: T | undefined; error: string | null; loading: boolean }

// Загрузка данных при монтировании и при смене deps; reload() — перезапросить
export function useAsync<T>(load: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<State<T>>({ data: undefined, error: null, loading: true })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    load().then(
      (data) => !cancelled && setState({ data, error: null, loading: false }),
      (e: unknown) =>
        !cancelled &&
        setState({ data: undefined, error: e instanceof Error ? e.message : String(e), loading: false }),
    )
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { ...state, reload }
}
