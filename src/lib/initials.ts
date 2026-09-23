import { fromKana } from 'hepburn';

function initials(text: string): string {
  return fromKana(text.toUpperCase())
    .substring(0, 2);
}

export default initials;
