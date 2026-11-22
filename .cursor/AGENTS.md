# Общие правила проекта «Сайты» (ML Detailing)

Пиши только по-русски, коротко и простыми словами.

## Проект
- Домена пока нет. Репозиторий: https://github.com/elisaferrari1100-blip/ml-detailing (ветка `main`).
- Локальная копия: `~/Desktop/Сайты/ML-Detailing` на Mac Мартины, 127.0.0.1:8090; превью всех веток 127.0.0.1:8095.
- Сервера пока нет, публикация через GitHub Pages: https://elisaferrari1100-blip.github.io/ml-detailing/
- Сайт статический (HTML, CSS, JS), сборки нет. Вся страница собирается в `js/app.js` (функция `renderPage()`, стр. 859–886), данные — в `js/config.js`.

## Агенты
- Каждый агент — облачный агент Cursor, модель ОБЯЗАТЕЛЬНО Composer 2.5.
- Роль и правила агента — в его карточке `.cursor/agents/agent-NN-*.md`, это его главный промпт. Название: «Агент N — <название>».
- Агенты работают параллельно, каждый в своей зоне, минимальные правки, своя ветка, PR, сами сливают в `main`.
- После запуска агенты работают сами и не будят дирижёра.
- В общих файлах (`js/app.js`, `js/config.js`, `css/extras.css`, `index.html`) каждый правит только свой участок (см. таблицу). `css/styles.css` — собранный файл, его не правит никто.
- Перед PR — проверить, что страница открывается без ошибок в консоли (`python3 -m http.server`).

## Ключи
- Ключ к серверу пока не нужен (Pages выкладывает сам). Когда появится сервер — Cursor Dashboard → Cloud Agents → Secrets.
- Никогда не показывать ключи, пароли, `.env` в чате и не пушить их в GitHub.

## Защита деплоя
- Перед слиянием и выкладкой: `git fetch`, проверить, что `HEAD` совпадает с `origin/main`. Не совпадает — СТОП, ничего не выкладывать, сообщить.
- После выкладки: сборка Pages прошла (https://github.com/elisaferrari1100-blip/ml-detailing/actions), сайт открывается. В отчёте — хэш коммита и время.
- Порядок выкладки — `.cursor/rules/cloud-deploy.mdc`. Без `push --force`, без удаления веток.

## Откат
- «Откати последнее» = `git revert` плохого коммита в `main` отдельным коммитом и выкладка обычным путём.

## Отчёт
- После каждой задачи — короткий список простыми словами, что Мартине проверить на сайте, плюс хэш и время.

## Ограничения
- Не больше 10 агентов одновременно, ненужных — в архив.
- Не создавать тестовые данные в настоящих аккаунтах. Проверки на сайте — только смотреть.
- Ничего не удалять на компьютере и в облачных дисках без спроса. Папки `ML-Detailing-A`, `ML-Detailing-B`, архив `ML-Detailing.tgz` не трогать.

## Агенты и зоны
Порядок на странице сверху вниз. Строки — `js/app.js`, если не сказано иное.

| № | Агент | Зона на сайте | Главные файлы и места |
|---|---|---|---|
| 1 | Агент 1 — Верхняя плашка (`agent-01-topbar.md`) | `#site-header`: логотип, меню, «Записаться», мобильное меню + тонкая полоса `#site-topbar` над ней (адрес, часы, телефон, VK) | `js/topbar.js`, `css/topbar.css`; `brandMark` 48–55, `renderHeader` 261–296, `bindHeader` 1003–1085, якоря в `bindGlobal` 1397–1421; config `nav`; extras.css 31–99, 590–726 |
| 2 | Агент 2 — Шапка (`agent-02-hero.md`) | `#hero`: фон, машина, логотип ML, «Детейлинг · Нижний Новгород», стрелка вниз | `heroCSSVars` 201–223, `renderHero` 225–259; config `hero`, `brand.kicker/heroWords/logoHero*`; index.html preload 42–47; extras.css 727–806 |
| 3 | Агент 3 — Работы (`agent-03-works.md`) | `#works`: «Поток работ», две бегущие ленты фото | `workCard` 182–190, `worksRow` 192–199, `renderPage` 864–874, `bindWorks` 1136–1247; config `sections.works`, `worksRow1/2`; extras.css 1–30 |
| 4 | Агент 4 — Услуги (`agent-04-services.md`) | `#services`: 6 услуг, фото, «В заявку» | 429–535, `refreshServicesChrome` 888–895, `bindServices` 1121–1134, `bindGlobal` 1422–1429, 1492–1499; config `sections.services`, `services` |
| 5 | Агент 5 — Отзывы (`agent-05-reviews.md`) | `#reviews`: рейтинг 5.0, 6 отзывов | `stars`/`reviewQuote`/`renderReviews` 573–619, `bindGlobal` 1455–1475; config `sections.reviews`, `reviewSummary`, `reviews` |
| 6 | Агент 6 — Цены (`agent-06-prices.md`) | `#request` (пункт меню «Цены»): фильтры, прайс, смета, форма заявки | 73–110, 621–817, 897–930, 997–1001, 1337–1394, `bindGlobal` 1430–1454, 1481–1489; config `sections.request`, `priceList`, `submitLead`; extras.css 480–497 |
| 7 | Агент 7 — О нас (`agent-07-about.md`) | `#about` (внутри секции `#faq`): текст, 4 счётчика, карта, контакты, кнопки | 298–384, `bindStats` 1087–1119, `bindGlobal` 1476–1480; config `about`, `stats`, `contacts`, `social.vk`, `sections.location`; extras.css 167–217 (про about), 298–424 |
| 8 | Агент 8 — Юридические документы (`agent-08-legal.md`) | подвал `.site-footer`, полоса `#legal-bar`, cookie-баннер, окно документов, `legal/*.html` | `js/legal.js`, `css/legal.css`, `legal/*.html`; `renderFooter`/`renderLegalBar`/`renderCookieBanner` 819–857, `bindCookieBanner` 1522–1537; config `legal`; extras.css 425–478, 498–567 |

## Ничьи зоны — менять только по прямой задаче дирижёра
- **Полоса слов «Тонировка ✦ Мойка ✦ …»** между «Работами» и «Услугами»: `textStrip(site.strips.services, "amber")` (стр. 875), `stripTrack`/`textStrip` 166–180, config `strips.services`.
- **Блок «До и после»** `#before-after` («Разница видна сразу», пара «Мойка двигателя», ползунок «Тяните»): `renderBeforeAfter` 541–571, `clampPos` 537–539, `bindBeforeAfter` 1249–1335; config `sections.beforeAfter`, `beforeAfter` (стр. 255–263); картинки `./images/before-after/pair-0-before.webp`, `pair-0-after.webp`.
- **Полоса слов «ML ✦ Detailing ✦ Нижний Новгород …»** между «До и после» и «Отзывами»: стр. 878, config `strips.brand`.
- **FAQ «Частые вопросы»** (8 вопросов) — секция `#faq`, в которой живёт блок «О нас»: `renderFaq` 386–426 (кроме вызова `renderAboutStudioAside`), config `sections.faq`, `faq` (264–313); extras.css 144–297 (кроме участков про about), фон `hex-ceiling`.
- **Пустой «Разбор работ»**: config `sections.cases`, `cases: []` (блок скрыт).
- **Общий каркас**: `index.html` (SEO, Open Graph, schema.org с ценами/рейтингом/адресом, `<noscript>`, шрифты, порядок скриптов), `applyTheme`/`theme`/`fonts`, `seo`, `siteUrl`, общие помощники `icon`, `btn`, `picture`, `heading`, `backdrop`, `esc` (стр. 24–160), `state` (стр. 9–22), `renderPage` (кроме участка «Работ»), запуск в конце app.js (1502–1520), прокрутка разделов extras.css 136–143 и 568–589.
- **Служебное**: `site.webmanifest`, `robots.txt`, `sitemap.xml`, иконки, `brand/`, `tools/*`, `*.command`, `README.md`, `.cursor/rules/*`, `.cursor/environment.json`, старая папка `agents/`, файлы `*.bak-arrow`.
