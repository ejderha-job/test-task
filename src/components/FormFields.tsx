import type { ReactNode } from 'react'
import { Field, Stack } from '@chakra-ui/react'

export type FormFieldConfig<V, Ctx = undefined> = {
  name: keyof V & string
  label: string
  required?: boolean
  helper?: string
  render: (props: { value: string; onChange: (value: string) => void; ctx: Ctx }) => ReactNode
}

// Поля формы по массиву-шаблону. ctx — дополнительные данные для render (например, списки для select)
export function FormFields<V extends Record<string, string>, Ctx = undefined>({
  fields,
  values,
  onChange,
  ctx,
}: {
  fields: FormFieldConfig<V, Ctx>[]
  values: V
  onChange: (name: keyof V & string, value: string) => void
  ctx: Ctx
}) {
  return (
    <Stack gap="5">
      {fields.map((f) => (
        <Field.Root key={f.name} required={f.required}>
          <Field.Label>
            {f.label}
            <Field.RequiredIndicator />
          </Field.Label>
          {f.render({ value: values[f.name], onChange: (v) => onChange(f.name, v), ctx })}
          {f.helper && <Field.HelperText>{f.helper}</Field.HelperText>}
        </Field.Root>
      ))}
    </Stack>
  )
}
