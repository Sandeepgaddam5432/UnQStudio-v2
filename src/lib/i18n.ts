import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { BRAND } from '@/lib/brand';

import en from '@/locales/en.json' with { type: 'json' };
import pt from '@/locales/pt.json' with { type: 'json' };
import zh from '@/locales/zh.json' with { type: 'json' };
import ha from '@/locales/ha.json' with { type: 'json' };
import yo from '@/locales/yo.json' with { type: 'json' };
import ig from '@/locales/ig.json' with { type: 'json' };

const resources = {
  en: { translation: en },
  pt: { translation: pt },
  zh: { translation: zh },
  ha: { translation: ha },
  yo: { translation: yo },
  ig: { translation: ig },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
      defaultVariables: {
        appName: BRAND.name,
        appDomain: BRAND.domain || 'localhost',
      },
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
