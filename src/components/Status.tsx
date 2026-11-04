// Состояния загрузки / ошибки для страниц
export function Loading() {
  return <p className="muted">Загрузка…</p>
}

export function LoadError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div>
      <p className="error">Не удалось загрузить данные: {message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Повторить
        </button>
      )}
    </div>
  )
}
