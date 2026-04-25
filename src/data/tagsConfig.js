/**
 * Definición central de las etiquetas que se muestran en cada caseta.
 * Cada grupo: id, label visible, lista de opciones y si admite múltiples.
 *
 * Formato del campo `tags` en la caseta:
 *   {
 *     musica: ['flamenco', 'rumba'],   // array (multi)
 *     publico: 'familiar',             // string (single)
 *     ambiente: 'tradicional',
 *     comida: 'comida' | 'bebida'
 *   }
 */

export const TAG_GROUPS = [
  {
    id: 'musica',
    label: 'Música',
    multi: true,
    options: [
      { value: 'flamenco', label: 'Flamenco' },
      { value: 'sevillanas', label: 'Sevillanas' },
      { value: 'rumba', label: 'Rumba' },
      { value: 'pop', label: 'Pop' },
      { value: 'latino', label: 'Latino / Reguetón' },
      { value: 'electronica', label: 'Electrónica' },
      { value: 'comercial', label: 'Comercial / Mixto' },
      { value: 'directo', label: 'Música en directo' },
    ],
  },
  {
    id: 'publico',
    label: 'Público',
    multi: false,
    options: [
      { value: 'familiar', label: 'Familiar' },
      { value: 'joven', label: 'Joven' },
      { value: 'adulto', label: 'Adulto' },
      { value: 'mixto', label: 'Mixto' },
    ],
  },
  {
    id: 'ambiente',
    label: 'Ambiente',
    multi: false,
    options: [
      { value: 'tradicional', label: 'Tradicional' },
      { value: 'moderno', label: 'Moderno' },
      { value: 'fiestero', label: 'Fiestero' },
      { value: 'tranquilo', label: 'Tranquilo' },
    ],
  },
  {
    id: 'comida',
    label: 'Comida',
    multi: false,
    options: [
      { value: 'comida', label: 'Comida' },
      { value: 'bebida', label: 'Sólo bebidas' },
    ],
  },
];

/** Devuelve el label visible de un value en un grupo de etiquetas. */
export function normalizeComidaValue(v) {
  if (v === 'tapas' || v === 'completo') return 'comida';
  return v;
}

export function tagLabel(groupId, value) {
  if (value == null) return value;
  const group = TAG_GROUPS.find((g) => g.id === groupId);
  if (!group) return value;
  const v = groupId === 'comida' ? normalizeComidaValue(value) : value;
  const opt = group.options.find((o) => o.value === v);
  return opt?.label || String(value);
}

/** Lista plana de pares { groupId, value, label } a partir de tags de caseta */
export function flattenTags(tags) {
  if (!tags) return [];
  const out = [];
  for (const group of TAG_GROUPS) {
    const v = tags[group.id];
    if (!v) continue;
    if (group.multi && Array.isArray(v)) {
      v.forEach((val) =>
        out.push({ groupId: group.id, value: val, label: tagLabel(group.id, val) }),
      );
    } else if (!group.multi) {
      out.push({ groupId: group.id, value: v, label: tagLabel(group.id, v) });
    }
  }
  return out;
}
