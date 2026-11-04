// Светлая/тёмная тема по системной настройке.
// Chakra включает тёмные цвета по классу `dark` на <html>, ставим его сами без next-themes.
export function syncColorModeWithSystem() {
  const query = window.matchMedia('(prefers-color-scheme: dark)')
  const apply = () => {
    const root = document.documentElement
    root.classList.toggle('dark', query.matches)
    root.style.colorScheme = query.matches ? 'dark' : 'light'
  }
  apply()
  query.addEventListener('change', apply)
}
