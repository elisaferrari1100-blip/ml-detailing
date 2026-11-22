/**
 * Контент и настройки сайта студии ML.
 * Меняйте тексты, цены и фото здесь — разметка соберётся сама.
 *
 * Отправка заявок: реализуйте window.ML_SITE.submitLead(payload).
 * По умолчанию форма в демонстрационном режиме (заявки никуда не уходят).
 */
window.ML_SITE = {
  /**
   * Публичный адрес сайта. Сейчас стоит ЗАГЛУШКА.
   * Перед публикацией замените на ваш домен и выполните:
   *   python3 tools/set-domain.py https://ваш-домен.ru
   * Скрипт обновит это поле, index.html, legal/*.html, robots.txt,
   * sitemap.xml и site.webmanifest.
   */
  siteUrl: "https://example.ru",

  brand: {
    name: "ML",
    short: "ML",
    heroWords: ["ML"],
    nameLetters: ["M", "L"],
    kicker: "Детейлинг · Нижний Новгород",
    city: "Нижний Новгород",
    logoMark: "./brand/logo-flat-v9-mark.webp",
    logoLockup: "./brand/logo-flat-v9.webp",
    logoPng: "./brand/logo-512.png",
    logoHero: "./brand/logo-flat-v9.webp",
    logoHeroPng: "./brand/logo-flat-v9.png",
    logoMarkPng: "./brand/logo-flat-v9-mark.png",
    monogramLetters: ["M", "L"],
    ogImage: "./brand/og-1200x630.png",
  },

  seo: {
    title: "Детейлинг в Нижнем Новгороде — студия ML | тонировка, бронирование плёнкой, химчистка",
    description: "Студия детейлинга ML в Нижнем Новгороде (ул. Коминтерна, 43А, корп. 2): тонировка от 2 500 ₽, бронирование кузова плёнкой, химчистка салона, полировка фар, антихром, мойка двигателя. Пн–Пт 10:00–20:00. Запись: +7 (999) 120-44-88.",
    keywords: "детейлинг Нижний Новгород, тонировка Нижний Новгород, бронирование плёнкой, полиуретановая плёнка, химчистка салона, полировка фар, антихром, антидождь, мойка двигателя, детейлинг-студия ML, Коминтерна 43А",
  },

  social: {
    vk: {
      url: "https://vk.ru/mldetailing",
      name: "ML Detailing",
      title: "Мы ВКонтакте",
      description: "Детейлинг-центр «ML» — забота о вашем автомобиле на профессиональном уровне!",
      cta: "Открыть сообщество",
    },
  },

  /**
   * Юридические реквизиты.
   * Нижняя полоса, тексты legal/*.html и schema.org берут значения отсюда.
   * Строка, в которой есть «[», показывается как незаполненный плейсхолдер.
   * Уже заполнено: legalName, inn, phone (тот же номер, что в contacts).
   * Владельцу осталось заменить только плейсхолдеры:
   *   email — почты пока нет, оставьте «[email]», пока адрес не появится
   *   ogrn  — ОГРНИП ещё не передан
   * Адрес студии живёт в contacts. Домен-заглушка — siteUrl выше.
   */
  legal: {
    legalName: "ИП Мольков Андрей Алексеевич",
    inn: "525916775770",
    ogrn: "[ОГРН/ОГРНИП]",
    email: "[email]",
    phone: "+7 (999) 120-44-88",
    docsUpdated: "16.11.2026",
  },
  theme: {
    accent: "#e5b869",
    accentLight: "#f3d9a4",
    accentDeep: "#b98b3e",
    background: "#070709",
    surface: "#101115",
  },
  fonts: {
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Unbounded:wght@400;500;600;700&display=swap",
    display: "'Unbounded', ui-sans-serif, system-ui, sans-serif",
    sans: "'Inter', ui-sans-serif, system-ui, sans-serif",
  },
  hero: {
    narrow: {
      bg: "./images/hero/narrow-bg.webp",
      width: 720,
      height: 720,
      alt: "Zeekr 007 в студии ML",
      focusX: 0.5,
      focusY: 0.5,
      textTop: 0.2,
      textSize: 0.106,
    },
    wide: {
      bg: "./images/hero/wide-bg.webp",
      width: 1920,
      height: 1920,
      focusX: 0.5,
      focusY: 0.48,
      textTop: 0.18,
      textSize: 0.106,
      bg4k: "./images/hero/wide-bg-4k.webp",
    },
  },
  nav: [
    { href: "#works", label: "Работы" },
    { href: "#services", label: "Услуги" },
    { href: "#reviews", label: "Отзывы" },
    { href: "#request", label: "Цены" },
    { href: "#about", label: "О нас" },
  ],
  strips: {
    services: [
      "Тонировка",
      "Мойка",
      "Стёкла",
      "Бронирование плёнкой",
      "Химчистка салона",
      "Антихром",
      "Полировка и защита фар",
    ],
    brand: ["ML", "Detailing", "Нижний Новгород", "Нижний Новгород", "ML", "Detailing"],
  },
  sections: {
    works: {
      eyebrow: "Наши работы",
      title: "Наши работы",
      lead: "Автомобили клиентов студии — фото с Яндекс Карт.",
    },
    services: {
      eyebrow: "Услуги",
      title: "Что мы делаем с автомобилем",
      lead: "Основные направления студии.",
      hintDesktop: "Нажмите на услугу, чтобы открыть подробности",
      hintTouch: "Откройте услугу, чтобы добавить её в заявку",
    },
    cases: { eyebrow: "Разбор работ", title: "Процесс и результат" },
    beforeAfter: {
      eyebrow: "До и после",
      title: "Разница видна сразу",
      lead: "Настоящие фото из студии.",
    },
    reviews: { eyebrow: "Отзывы", title: "Нам доверяют автомобили" },
    faq: {
      eyebrow: "Вопросы и ответы",
      title: "Частые вопросы",
      lead: "Запись, сроки работ и стоимость — без лишних звонков.",
    },
    location: { eyebrow: "Как добраться", title: "Как нас найти" },
    request: {
      eyebrow: "Калькулятор",
      title: "Соберите заявку",
      lead: "Отметьте услуги — сразу увидите ориентир по цене. Точную стоимость назовут после осмотра.",
      standard: {
        title: "Как считается цена",
        text: "В прайсе все суммы указаны «от». Итог зависит от автомобиля и его состояния — точную стоимость назовём после осмотра.",
      },
      totalNote: "сумма «от» по выбранным позициям",
    },
  },
  about: {
    brandTitle: "ML Detailing",
    text: "Студия детейлинга в Нижнем Новгороде: тонировка, бронирование плёнкой, химчистка салона и уход за автомобилем.",
  },
  stats: [
    {
      key: "rating",
      value: 5,
      decimals: 1,
      suffix: " ★",
      label: "на Яндекс Картах",
      description: "Средняя оценка студии по 88 оценкам.",
    },
    {
      key: "ratings",
      value: 88,
      label: "оценок клиентов",
      description: "Оценки, которые клиенты поставили студии на Яндекс Картах.",
    },
    {
      key: "reviews",
      value: 78,
      label: "отзывов",
      description: "Отзывы клиентов на Яндекс Картах.",
    },
    {
      key: "services",
      value: 7,
      label: "позиций в прайсе",
      description: "Услуги с ценами, опубликованные студией.",
    },
  ],
  worksRow1: [
    { key: "work-10", badge: "Zeekr 007", src: "./images/works/work-10.webp", srcSmall: "./images/works/work-10-800.webp", alt: "Zeekr 007 — ML", width: 1016, height: 1016 },
    { key: "work-11", badge: "Porsche Panamera GTS", src: "./images/works/work-11.webp", srcSmall: "./images/works/work-11-800.webp", alt: "Porsche Panamera GTS — ML", width: 1086, height: 1086 },
    { key: "work-12", badge: "Honda CR-V", src: "./images/works/work-12.webp", srcSmall: "./images/works/work-12-800.webp", alt: "Honda CR-V — ML", width: 918, height: 918 },
    { key: "work-13", badge: "Kia Ceed", src: "./images/works/work-13.webp", srcSmall: "./images/works/work-13-800.webp", alt: "Kia Ceed — ML", width: 1086, height: 1086 },
    { key: "work-14", badge: "Changan UNI-T", src: "./images/works/work-14.webp", srcSmall: "./images/works/work-14-800.webp", alt: "Changan UNI-T — ML", width: 1086, height: 1086 },
    { key: "work-15", badge: "Porsche Panamera GTS", src: "./images/works/work-15.webp", srcSmall: "./images/works/work-15-800.webp", alt: "Porsche Panamera GTS — ML", width: 1086, height: 1086 },
  ],
  worksRow2: [
    { key: "work-16", badge: "Mercedes-Benz ML", src: "./images/works/work-16.webp", srcSmall: "./images/works/work-16-800.webp", alt: "Mercedes-Benz ML — ML", width: 1086, height: 1086 },
    { key: "work-17", badge: "Mitsubishi Lancer, Mercedes-Benz S-Class", src: "./images/works/work-17.webp", srcSmall: "./images/works/work-17-800.webp", alt: "Mitsubishi Lancer и Mercedes-Benz S-Class — ML", width: 998, height: 998 },
    { key: "work-18", badge: "Porsche Cayenne", src: "./images/works/work-18.webp", srcSmall: "./images/works/work-18-800.webp", alt: "Porsche Cayenne — ML", width: 1086, height: 1086 },
    { key: "work-19", badge: "Mercedes-Benz CLS", src: "./images/works/work-19.webp", srcSmall: "./images/works/work-19-800.webp", alt: "Mercedes-Benz CLS — ML", width: 1086, height: 1086 },
    { key: "work-20", badge: "Zeekr 007", src: "./images/works/work-20.webp", srcSmall: "./images/works/work-20-800.webp", alt: "Zeekr 007 — ML", width: 1016, height: 1016 },
    { key: "work-00", badge: "Porsche Panamera", src: "./images/works/work-00.webp", srcSmall: "./images/works/work-00-800.webp", alt: "Porsche Panamera — ML", width: 1280, height: 800 },
    { key: "work-01", badge: "Mercedes-Benz G-Class", src: "./images/works/work-01.webp", srcSmall: "./images/works/work-01-800.webp", alt: "Mercedes-Benz G-Class — ML", width: 1280, height: 800 },
    { key: "work-02", badge: "Mercedes-Benz CLS", src: "./images/works/work-02.webp", srcSmall: "./images/works/work-02-800.webp", alt: "Mercedes-Benz CLS — ML", width: 1280, height: 800 },
    { key: "work-03", badge: "BMW 3 Series", src: "./images/works/work-03.webp", srcSmall: "./images/works/work-03-800.webp", alt: "BMW 3 Series — ML", width: 1280, height: 800 },
    { key: "work-04", badge: "BMW 6 Series", src: "./images/works/work-04.webp", srcSmall: "./images/works/work-04-800.webp", alt: "BMW 6 Series — ML", width: 1280, height: 800 },
    { key: "work-05", badge: "Mercedes-Benz S-Class", src: "./images/works/work-05.webp", srcSmall: "./images/works/work-05-800.webp", alt: "Mercedes-Benz S-Class — ML", width: 1280, height: 800 },
    { key: "work-06", badge: "Porsche Cayenne", src: "./images/works/work-06.webp", srcSmall: "./images/works/work-06-800.webp", alt: "Porsche Cayenne — ML", width: 912, height: 570 },
    { key: "work-07", badge: "Lada Priora", src: "./images/works/work-07.webp", srcSmall: "./images/works/work-07-800.webp", alt: "Lada Priora — ML", width: 1280, height: 800 },
    { key: "work-08", badge: "Kia Picanto", src: "./images/works/work-08.webp", srcSmall: "./images/works/work-08-800.webp", alt: "Kia Picanto — ML", width: 960, height: 600 },
    { key: "work-09", badge: "Changan UNI-K", src: "./images/works/work-09.webp", srcSmall: "./images/works/work-09-800.webp", alt: "Changan UNI-K — ML", width: 961, height: 601 },
  ],
  services: [
    {
      key: "ppf",
      title: "Бронирование плёнкой",
      description:
        "Оклеиваем кузов или отдельные зоны полиуретановой плёнкой: капот, бампер, фары, пороги. Помогает держать лак от сколов и царапин в быту.",
      priceItem: "ppf-x0",
      price: "от 5\u00a0000\u00a0₽",
      image: { src: "./images/services/ppf.webp", srcSmall: "./images/services/ppf-800.webp", alt: "Бронирование плёнкой — работа студии ML", width: 1024, height: 1280 },
    },
    {
      key: "tint",
      title: "Тонировка",
      description: "Тонировка стёкол: передний или задний полукруг, боковые стёкла. Подбираем плёнку под задачу и автомобиль.",
      priceItem: "tint-3",
      price: "от 2\u00a0000\u00a0₽",
      image: { src: "./images/services/tint.webp", srcSmall: "./images/services/tint-800.webp", alt: "Тонировка — работа студии ML", width: 960, height: 1200 },
    },
    {
      key: "interior",
      title: "Химчистка салона",
      description: "Чистим салон: сиденья, потолок, ковры, пластик. Работаем с пятнами и следами эксплуатации — состав подбираем по состоянию.",
      priceItem: "interior-x0",
      price: "от 5\u00a0000\u00a0₽",
      image: { src: "./images/services/interior.webp", srcSmall: "./images/services/interior-800.webp", alt: "Химчистка салона — работа студии ML", width: 961, height: 1201 },
    },
    {
      key: "optics",
      title: "Восстановление оптики",
      description: "Восстанавливаем помутневшие фары полировкой: убираем налёт и жёлтый оттенок, возвращаем прозрачность стёкла.",
      priceItem: "optics-x0",
      price: "от 5\u00a0000\u00a0₽",
      image: { src: "./images/services/optics.webp", srcSmall: "./images/services/optics-800.webp", alt: "Восстановление оптики — работа студии ML", width: 1024, height: 1280 },
    },
    {
      key: "styling",
      title: "Антихром",
      description: "Закрываем хром чёрной плёнкой: молдинги, решётка, окантовка стёкол. Плёнку можно снять — родной хром остаётся под ней.",
      priceItem: "styling-x0",
      price: "от 1\u00a0000\u00a0₽",
      image: { src: "./images/services/styling.webp", srcSmall: "./images/services/styling-800.webp", alt: "Антихром — работа студии ML", width: 1024, height: 1280 },
    },
    {
      key: "sound",
      title: "Шумоизоляция",
      description: "Дополнительная шумоизоляция салона и дверей: меньше шума с дороги и мотора. Объём работ зависит от автомобиля.",
      priceItem: "sound-doors",
      price: "от 10\u00a0000\u00a0₽",
      image: {
        src: "./images/works/work-14.webp",
        srcSmall: "./images/works/work-14-800.webp",
        alt: "Шумоизоляция — работа студии ML",
        width: 1096,
        height: 1096,
      },
    },
    {
      key: "polish",
      title: "Полировка автомобиля",
      description: "Полировка кузова: убираем мелкие царапины и следы ухода, выравниваем блеск лака. Глубину работы оцениваем на осмотре.",
      priceItem: "polish-body",
      price: "от 10\u00a0000\u00a0₽",
      image: {
        src: "./images/works/work-02.webp",
        srcSmall: "./images/works/work-02-800.webp",
        alt: "Полировка автомобиля — работа студии ML",
        width: 1280,
        height: 800,
      },
    },
  ],
  /* Пустой массив скрывает блок «Разбор работ», как на оригинальном сайте. */
  cases: [],
  beforeAfter: [
    {
      key: "pair-0",
      title: "Мойка двигателя",
      caption: "Подкапотное пространство до и после детейлинг-мойки с консервацией.",
      before: { src: "./images/before-after/pair-0-before.webp", alt: "Мойка двигателя: до работ", width: 1400, height: 1789 },
      after: { src: "./images/before-after/pair-0-after.webp", alt: "Мойка двигателя: после работ", width: 1400, height: 1789 },
    },
  ],
  faq: [
    {
      key: "faq-record",
      question: "Как записаться в студию?",
      answer:
        "Позвоните по телефону на сайте или оставьте заявку в разделе «Цены» — перезвоним и согласуем время.",
    },
    {
      key: "faq-price",
      question: "Почему в калькуляторе одна цена, а на осмотре другая?",
      answer:
        "Сумма в заявке — ориентир по прайсу. Точную стоимость мастер называет после осмотра: зависят марка, размер кузова и состояние.",
    },
    {
      key: "faq-time",
      question: "Сколько длится работа?",
      answer:
        "Тонировка часто укладывается в один день, химчистка и бронирование — от нескольких часов до пары дней. Срок скажем при записи.",
    },
    {
      key: "faq-warranty",
      question: "Есть ли гарантия на работы?",
      answer:
        "Да, на основные услуги даём гарантию. Условия зависят от вида работ — уточняйте у мастера при приёмке автомобиля.",
    },
    {
      key: "faq-wait",
      question: "Можно ли подождать в студии?",
      answer:
        "Да, можно. Для длительных работ удобнее оставить машину и забрать в согласованное время — согласуем заранее.",
    },
    {
      key: "faq-prep",
      question: "Как подготовить автомобиль к визиту?",
      answer:
        "Приезжайте в согласованное время. Для тонировки и плёнки желательно разгрузить багажник и убрать лишнее из салона — детали подскажем при записи.",
    },
    {
      key: "faq-payment",
      question: "Как можно оплатить услуги?",
      answer:
        "Принимаем наличные и безналичный расчёт. Способ оплаты уточняем при записи или на месте после согласования сметы.",
    },
    {
      key: "faq-parking",
      question: "Где припарковаться у студии?",
      answer:
        "Мы на ул. Коминтерна, 43А, корп. 2. Точную точку и маршрут смотрите на карте рядом или в Яндекс Картах.",
    },
  ],
  reviewSummary: { rating: "5.0", text: "на основе 88 оценок в Яндекс Картах" },
  reviews: [
    {
      key: "r0",
      author: "Даниил Романов",
      initials: "ДР",
      rating: 5,
      text: "Езжу в эту студию уже не первый раз — и ни разу не разочаровался! В последний визит делал тонировку — всё, как всегда, на высшем уровне: аккуратно, быстро, без каких‑либо дефектов. Мастера знают своё дело, общаются вежливо и всегда подскажут, если есть вопросы. Видно, что работают с душой. Однозначно 5 звёзд и моя искренняя рекомендация!",
      source: "Яндекс Карты",
    },
    {
      key: "r1",
      author: "Дима Перлов",
      initials: "ДП",
      rating: 5,
      text: "«Если хотите сделать тонировку один раз и забыть — вам сюда. Ребята приклеили пленку аккуратно, формовку заднего сложного стекла на Ауди сделали с первого раза без брака. Визуально машина стала эстетичнее а пленка лежит как родная краска. Никаких \"паутинок\". Сделали быстро, ценник честный, гарантия на руках. Сервис уровня А+».",
      source: "Яндекс Карты",
      rawQuoted: true,
    },
    {
      key: "r2",
      author: "Наталия Д.",
      initials: "НД",
      rating: 5,
      text: "Обратилась за детейлинг мойкой автомобиля, чистота как в операционной. \nТак же решила передлать заднюю полусферу, выбрала 5% тонировку, ребята сделали быстро и самое главное качественно.\nВсе объяснили и показали.\nОднозначно рекомендую и буду обращаться снова👍",
      source: "Яндекс Карты",
    },
    {
      key: "r3",
      author: "александр м.",
      initials: "АМ",
      rating: 5,
      text: "Посетил на этот раз мойку, (комплекс) по предварительной записи без ожиданий в назначенное время что очень удобно. Качественно намыли ( двумя видами пены) доп обработкой особо загрязненных мест, пылесос, протирки, дверные проемы, чернение резины…\nАвто выехал как новое, парни молодцы, рекомендую.",
      source: "Яндекс Карты",
    },
    {
      key: "r4",
      author: "Александр Волков",
      initials: "АВ",
      rating: 5,
      text: "Оставлял машину в химчистку салона и мойку мотора. Ребята молодцы, отлично справились. Салон был грязный, особенно пол весь в соленых белых разводах. Теперь как новый. Ещё и фары отполировали в подарок!👍 Круто! Желаю удачи и процветания!",
      source: "Яндекс Карты",
    },
    {
      key: "r5",
      author: "Дарья Власова",
      initials: "ДВ",
      rating: 5,
      text: "Записывались только на тонировку, но ребята молодцы - подсказали, что новую машину лучше сразу обклеить бронепленкой. Сделали всё супер класс! Мастера своего дела, работают быстро и аккуратно. Теперь и стекла тонированные, и кузов под защитой. Огромное спасибо, рекомендую!",
      source: "Яндекс Карты",
    },
  ],
  contacts: {
    studioName: "ML",
    address: "Нижний Новгород, ул. Коминтерна, 43А, корп. 2",
    district: "Нижний Новгород, улица Коминтерна, 43А, корп. 2",
    schedule: "Пн–Пт 10:00–20:00",
    scheduleNote: "",
    yandexOrgUrl: "https://yandex.ru/maps/org/ml/13418438493/",
    yandexWidgetUrl: "https://yandex.ru/map-widget/v1/?ll=43.885406%2C56.3449&z=16&oid=13418438493&ol=biz",
    phone: "+7 (999) 120-44-88",
  },
  priceGroupOrder: [
    "Тонировка",
    "Мойка",
    "Стёкла",
    "Броня",
    "Химчистка",
    "Другое",
    "Шумоизоляция",
  ],
  priceList: [
    { key: "tint-front", group: "Тонировка", title: "Передний полукруг", price: 5000 },
    { key: "tint-3", group: "Тонировка", title: "Боковые стёкла", price: 2700 },
    { key: "tint-wind", group: "Тонировка", title: "Лобовое стекло", price: 3000 },
    { key: "wash-tech", group: "Мойка", title: "Техническая мойка", price: 500 },
    { key: "wash-std", group: "Мойка", title: "Стандарт", price: 1000 },
    { key: "wash-complex", group: "Мойка", title: "Комплекс", price: 1500 },
    { key: "wash-detail", group: "Мойка", title: "Детейлинг-мойка", price: 2300 },
    { key: "glass-5", group: "Стёкла", title: "Чистка от водного камня", price: 1000 },
    { key: "glass-6", group: "Стёкла", title: "Антидождь", price: 3500 },
    { key: "ppf-roof", group: "Броня", title: "Оклейка крыши в чёрный", price: 15000 },
    { key: "ppf-lights", group: "Броня", title: "Фары", price: 5000 },
    { key: "ppf-x1", group: "Броня", title: "Зоны риска", price: 25000 },
    { key: "ppf-x0", group: "Броня", title: "Полная оклейка", price: 130000 },
    { key: "interior-x0", group: "Химчистка", title: "Лёгкая химчистка", price: 5000 },
    { key: "interior-x1", group: "Химчистка", title: "Химчистка сидений", price: 2000 },
    { key: "interior-full", group: "Химчистка", title: "Полная с разбором", price: 10000 },
    { key: "styling-x0", group: "Другое", title: "Антихром", price: 2000 },
    { key: "optics-x0", group: "Другое", title: "Полировка фар", price: 2500 },
    { key: "polish-body", group: "Другое", title: "Полировка кузова", price: 10000 },
    { key: "sound-doors", group: "Шумоизоляция", title: "4 двери", price: 10000 },
    { key: "sound-roof", group: "Шумоизоляция", title: "Крыша", price: 10000 },
    { key: "sound-floor", group: "Шумоизоляция", title: "Пол", price: 20000 },
    { key: "sound-full", group: "Шумоизоляция", title: "Полная шумоизоляция", price: 65000 },
  ],

  /**
   * Отправка заявок. Укажите `endpoint` (URL обработчика), чтобы включить POST в сеть.
   * Пустая строка — заявка обрабатывается только на странице (без запроса на сервер).
   * payload: { name, phone, car, items, total, hasOnRequest }
   */
  leads: {
    endpoint: "",
  },

  async submitLead(payload) {
    const endpoint = (site.leads?.endpoint || "").trim();
    if (endpoint) {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(detail || `Ошибка отправки (${res.status})`);
      }
      return { sent: true };
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { sent: false };
  },
};
