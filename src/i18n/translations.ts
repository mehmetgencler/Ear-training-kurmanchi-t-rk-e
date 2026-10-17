import { Language } from '../types/music.js';

export interface Translations {
  // App header & branding
  appTitle: string;
  appSubtitle: string;
  madeBy: string;
  chordTrainingTab: string;
  intervalTrainingTab: string;
  languageSelectLabel: string;

  // Instrument selector
  instrumentLabel: string;
  instrumentSubtitle: string;
  acousticPiano: string;
  electricPiano: string;

  // Pitch range
  pitchRangeLabel: string;
  pitchRangeOctaves: string;
  pitchRangeSubtitle: (label: string, minMidi: number, maxMidi: number) => string;

  // Chord Playback Mode & Sustain
  chordPlaybackModeTitle: string;
  chordPlaybackModeSubtitle: string;
  chordModeSimultaneous: string;
  chordModeSequential: string;
  chordSustainLabel: string;
  chordSustainSubtitle: string;

  // Interval Playback Mode & Spacing
  intervalPlaybackModeTitle: string;
  intervalPlaybackModeSubtitle: string;
  intervalModeHarmonic: string;
  intervalModeMelodic: string;
  melodicDirectionLabel: string;
  melodicDirectionSubtitle: string;
  melodicDirectionBoth: string;
  melodicDirectionAscending: string;
  melodicDirectionDescending: string;
  noteSpacingLabel: string;
  noteSpacingSubtitle: string;

  // Quiz Workspace
  chordQuizInProgress: string;
  intervalQuizInProgress: string;
  activeTypesCount: (count: number) => string;
  activeIntervalsCount: (count: number) => string;
  replaySound: string;
  settings: string;
  whichChordDidYouHear: string;
  selectChordSubtitle: string;
  whichIntervalDidYouHear: string;
  selectIntervalSubtitle: string;

  // Feedback
  correct: string;
  incorrect: string;
  answerLabel: string;
  notesPlayed: string;
  rootLabel: string;
  formulaLabel: string;
  distanceLabel: string;
  semitonesUnit: (count: number) => string;
  harmonicBadge: string;
  ascendingBadge: string;
  descendingBadge: string;
  replayButton: string;
  nextQuestionButton: string;

  // Selection panels
  activeChordSelectionTitle: string;
  activeChordSelectionSubtitle: (active: number, total: number) => string;
  threeNoteChordsHeading: string;
  fourNoteChordsHeading: string;
  activeIntervalSelectionTitle: string;
  activeIntervalSelectionSubtitle: (active: number, total: number) => string;
  selectAll: string;
  clearAll: string;
  statusActive: string;
  statusOff: string;

  // Ready & start states
  pleaseSelectChordAlert: string;
  pleaseSelectIntervalAlert: string;
  readyWithChords: (count: number) => string;
  readyWithIntervals: (count: number) => string;
  startChordQuiz: string;
  restartChordQuiz: string;
  startIntervalQuiz: string;
  restartIntervalQuiz: string;
  audioErrorNotice: string;

  // Mistakes Module
  mistakesTab: string;
  mistakesTitle: string;
  mistakesSubtitle: string;
  totalMistakesLabel: string;
  mostMissedChordLabel: string;
  lastMistakeDateLabel: string;
  uniqueChordsMissedLabel: string;
  mistakeDistributionTitle: string;
  mistakeDistributionSubtitle: string;
  rankedMistakesTitle: string;
  rankedMistakesSubtitle: string;
  chordTypeHeader: string;
  formulaHeader: string;
  mistakeCountHeader: string;
  percentageHeader: string;
  lastOccurredHeader: string;
  clearMistakesButton: string;
  confirmClearTitle: string;
  confirmClearMessage: string;
  confirmYes: string;
  confirmCancel: string;
  noMistakesTitle: string;
  noMistakesDescription: string;
  neverRecorded: string;
  timesCount: (count: number) => string;

  // Footer
  footerText: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  ku: {
    // App header & branding (Kurmancî)
    appTitle: 'Perwerdeya Guhî',
    appSubtitle: 'Akor & Navber',
    madeBy: 'Ji aliyê M.Gençler ve hate çêkirin',
    chordTrainingTab: 'Perwerdeya Akoran',
    intervalTrainingTab: 'Perwerdeya Navberan',
    languageSelectLabel: 'Ziman',

    // Instrument selector
    instrumentLabel: 'Amûr',
    instrumentSubtitle: '(Nimûneyên piyanoyê & Piyanoya elektrîkê)',
    acousticPiano: 'Piyanoya Akûstîk',
    electricPiano: 'Piyanoya Elektrîkê',

    // Pitch range
    pitchRangeLabel: 'Qada Dengê ya Pirsê',
    pitchRangeOctaves: 'Oktav',
    pitchRangeSubtitle: (label, minMidi, maxMidi) =>
      `Notayên pirsê di navbera ${label} de tên hilbijartin (MIDI ${minMidi}–${maxMidi})`,

    // Chord Playback Mode & Sustain
    chordPlaybackModeTitle: 'Moda Lêdana Akorê',
    chordPlaybackModeSubtitle: 'Awayê lêdana notayên akorê di dema testê de hilbijêre',
    chordModeSimultaneous: 'Moda A: Hemwext (Bi hev re)',
    chordModeSequential: 'Moda B: Li pey hev, paşê hemwext',
    chordSustainLabel: 'Dema Domandina Akorê:',
    chordSustainSubtitle: 'Akor çiqas dirêj bimîne û zengil bide da ku her rengekî tonê bi zelalî bê bihîstin',

    // Interval Playback Mode & Spacing
    intervalPlaybackModeTitle: 'Moda Lêdana Navberê',
    intervalPlaybackModeSubtitle: 'Awayê lêdana navberê ya harmonîk an melodîk hilbijêre',
    intervalModeHarmonic: 'Moda A: Harmonîk',
    intervalModeMelodic: 'Moda B: Melodîk (Hildikişe & Dadikeve)',
    melodicDirectionLabel: 'Hêla Melodîk:',
    melodicDirectionSubtitle: '(Diyarke ka notayên navberê ber bi jor, ber bi jêr, an her duyan ve herin)',
    melodicDirectionBoth: 'Her du (Hildikişe & Dadikeve)',
    melodicDirectionAscending: 'Tenê ber bi jor',
    melodicDirectionDescending: 'Tenê ber bi jêr',
    noteSpacingLabel: 'Navbera Dema Notan:',
    noteSpacingSubtitle: 'Dema di navbera nota yekem û duyem de (ji bo nasîna deng demê zêde bike)',

    // Quiz Workspace
    chordQuizInProgress: 'Testa Akoran Didome',
    intervalQuizInProgress: 'Testa Navberan Didome',
    activeTypesCount: (count) => `(${count} celebên çalak)`,
    activeIntervalsCount: (count) => `(${count} navberên çalak)`,
    replaySound: 'Dengê Dubare Bike',
    settings: 'Mîheng',
    whichChordDidYouHear: 'Te kîjan akor bihîst?',
    selectChordSubtitle: 'Ji heşt celebên akorê yên li jêr yekê hilbijêre',
    whichIntervalDidYouHear: 'Te kîjan navber bihîst?',
    selectIntervalSubtitle: 'Ji diwanzdeh navberên li jêr yekê hilbijêre',

    // Feedback
    correct: 'Rast e!',
    incorrect: 'Şaş e',
    answerLabel: 'Bersiv:',
    notesPlayed: 'Notayên hatine lêdan:',
    rootLabel: 'Bingeh:',
    formulaLabel: 'Formul:',
    distanceLabel: 'Dûrahî:',
    semitonesUnit: (count) => `${count} nîvton`,
    harmonicBadge: '(Harmonîk)',
    ascendingBadge: '(Hildikişe ↑)',
    descendingBadge: '(Dadikeve ↓)',
    replayButton: 'Dubare Bike',
    nextQuestionButton: 'Pirsa Din',

    // Selection panels
    activeChordSelectionTitle: 'Hilbijartina Akorên Çalak',
    activeChordSelectionSubtitle: (active, total) =>
      `Celebên akorê yên ku di testê de cih digirin diyar bike (${active} ji ${total} çalak e)`,
    threeNoteChordsHeading: 'Akorên Sê-Notayî (Trîad)',
    fourNoteChordsHeading: 'Akorên Çar-Notayî (Heftemîn)',
    activeIntervalSelectionTitle: 'Hilbijartina Navberên Çalak',
    activeIntervalSelectionSubtitle: (active, total) =>
      `Navberên ku di testê de cih digirin diyar bike (${active} ji ${total} çalak e)`,
    selectAll: 'Hemûyan Hilbijêre',
    clearAll: 'Hemûyan Paqij Bike',
    statusActive: 'ÇALAK',
    statusOff: 'GIRTÎ',

    // Ready & start states
    pleaseSelectChordAlert: 'Ji kerema xwe herî kêm celebekî akorê li jor hilbijêre.',
    pleaseSelectIntervalAlert: 'Ji kerema xwe herî kêm navberekê li jor hilbijêre.',
    readyWithChords: (count) => `Amade ye bi ${count} celebên akorê yên çalak.`,
    readyWithIntervals: (count) => `Amade ye bi ${count} navberên çalak.`,
    startChordQuiz: 'Testa Akoran Dest Pê Bike',
    restartChordQuiz: 'Bi Hilbijartinê Ji Nû Ve Dest Pê Bike',
    startIntervalQuiz: 'Testa Navberan Dest Pê Bike',
    restartIntervalQuiz: 'Bi Hilbijartinê Ji Nû Ve Dest Pê Bike',
    audioErrorNotice:
      'Lêdana deng hewceyê destpêkê têkiliya bikarhêner e. Ji kerema xwe li "Dengê Dubare Bike" bixe.',

    // Mistakes Module (Kurmancî)
    mistakesTab: 'Şaşiyên Min',
    mistakesTitle: 'Tomara Şaşiyan & Analîz',
    mistakesSubtitle: 'Şaşiyên we yên testa akoran bi awayekî xwemalî di geroka we de têne parastin',
    totalMistakesLabel: 'Tevahiya Şaşiyan',
    mostMissedChordLabel: 'Akora Herî Pir Şaş Bûyî',
    lastMistakeDateLabel: 'Dîroka Şaşiya Dawî',
    uniqueChordsMissedLabel: 'Cureyên Akorên Şaş',
    mistakeDistributionTitle: 'Belavbûna Şaşiyan Li Gorî Akoran',
    mistakeDistributionSubtitle: 'Rêjeya şaşiyan ji bo her cureyekî akorê',
    rankedMistakesTitle: 'Lîsteya Şaşiyan',
    rankedMistakesSubtitle: 'Li gorî hejmara şaşiyan hatiye rêzkirin',
    chordTypeHeader: 'Cureyê Akorê',
    formulaHeader: 'Formûl',
    mistakeCountHeader: 'Hejmara Şaşiyan',
    percentageHeader: 'Rêje',
    lastOccurredHeader: 'Cara Dawî',
    clearMistakesButton: 'Hemû Şaşiyan Paqij Bike',
    confirmClearTitle: 'Tomara Şaşiyan Paqij Bibe?',
    confirmClearMessage: 'Hûn bawer in ku dixwazin hemû şaşiyên xwe yên tomarkirî ji gerokê paqij bikin? Ev nayê vegerandin.',
    confirmYes: 'Erê, Paqij Bike',
    confirmCancel: 'Betal Bike',
    noMistakesTitle: 'Hîna ti şaşî nehatine tomarkirin',
    noMistakesDescription: 'Dema ku hûn di ezmûna akoran de bersivek şaş bidin, ew ê bi hejmar û dîrokê ve li vir bê tomarkirin.',
    neverRecorded: 'Nehatiye tomarkirin',
    timesCount: (count) => `${count} car`,

    // Footer
    footerText:
      'Piyanoya Akûstîk (nimûneyên rastîn ên piyanoyê) & Piyanoya Elektrîkê (sentetîk) · Akorên pozîsyona bingehîn · Navberên hildikişin & dadikevin',
  },

  tr: {
    // App header & branding (Türkçe)
    appTitle: 'Kulak Eğitimi',
    appSubtitle: 'Akorlar & Aralıklar',
    madeBy: 'M.Gençler tarafından yapılmıştır',
    chordTrainingTab: 'Akor Eğitimi',
    intervalTrainingTab: 'Aralık Eğitimi',
    languageSelectLabel: 'Dil',

    // Instrument selector
    instrumentLabel: 'Enstrüman',
    instrumentSubtitle: '(Kayıtlı akustik örnekler & Sentezlenmiş elektro piyano)',
    acousticPiano: 'Akustik Piyano',
    electricPiano: 'Elektro Piyano',

    // Pitch range
    pitchRangeLabel: 'Soru Ses Aralığı',
    pitchRangeOctaves: 'Oktav',
    pitchRangeSubtitle: (label, minMidi, maxMidi) =>
      `Notalar ${label} aralığında üretilir (MIDI ${minMidi}–${maxMidi})`,

    // Chord Playback Mode & Sustain
    chordPlaybackModeTitle: 'Akor Çalma Modu',
    chordPlaybackModeSubtitle: 'Test sırasında akor seslerinin nasıl çalınacağını seçin',
    chordModeSimultaneous: 'Mod A: Armonik (Aynı anda)',
    chordModeSequential: 'Mod B: Ardışık, ardından armonik',
    chordSustainLabel: 'Akor Tınlama Süresi:',
    chordSustainSubtitle: 'Akor seslerinin ve renginin net duyulması için uzama süresi',

    // Interval Playback Mode & Spacing
    intervalPlaybackModeTitle: 'Aralık Çalma Modu',
    intervalPlaybackModeSubtitle: 'Armonik veya melodik (çıkıcı & inici) çalma biçimini seçin',
    intervalModeHarmonic: 'Mod A: Armonik',
    intervalModeMelodic: 'Mod B: Melodik (Çıkıcı & İnici)',
    melodicDirectionLabel: 'Melodik Yön:',
    melodicDirectionSubtitle: '(Notaların yukarı, aşağı veya her iki yönde çalınmasını belirler)',
    melodicDirectionBoth: 'Her ikisi (Çıkıcı & İnici)',
    melodicDirectionAscending: 'Yalnızca çıkıcı',
    melodicDirectionDescending: 'Yalnızca inici',
    noteSpacingLabel: 'Notalar Arası Süre:',
    noteSpacingSubtitle: 'Birinci ve ikinci nota arasındaki süre (net perde ayrımı için süreyi artırın)',

    // Quiz Workspace
    chordQuizInProgress: 'Akor Testi Devam Ediyor',
    intervalQuizInProgress: 'Aralık Testi Devam Ediyor',
    activeTypesCount: (count) => `(${count} etkin tür)`,
    activeIntervalsCount: (count) => `(${count} etkin aralık)`,
    replaySound: 'Sesi Tekrar Dinle',
    settings: 'Ayarlar',
    whichChordDidYouHear: 'Hangi akoru duydunuz?',
    selectChordSubtitle: 'Aşağıdaki sekiz akor türünden birini seçin',
    whichIntervalDidYouHear: 'Hangi aralığı duydunuz?',
    selectIntervalSubtitle: 'Aşağıdaki on iki aralıktan birini seçin',

    // Feedback
    correct: 'Doğru!',
    incorrect: 'Yanlış',
    answerLabel: 'Cevap:',
    notesPlayed: 'Çalınan notalar:',
    rootLabel: 'Kök:',
    formulaLabel: 'Formül:',
    distanceLabel: 'Mesafe:',
    semitonesUnit: (count) => `${count} yarım ton`,
    harmonicBadge: '(Armonik)',
    ascendingBadge: '(Çıkıcı ↑)',
    descendingBadge: '(İnici ↓)',
    replayButton: 'Tekrar Dinle',
    nextQuestionButton: 'Sonraki Soru',

    // Selection panels
    activeChordSelectionTitle: 'Etkin Akor Seçimi',
    activeChordSelectionSubtitle: (active, total) =>
      `Teste dahil edilecek akor türlerini belirleyin (${active} / ${total} etkin)`,
    threeNoteChordsHeading: 'Üç Notalı Akorlar (Triadlar)',
    fourNoteChordsHeading: 'Dört Notalı Akorlar (Yedililer)',
    activeIntervalSelectionTitle: 'Etkin Aralık Seçimi',
    activeIntervalSelectionSubtitle: (active, total) =>
      `Teste dahil edilecek aralıkları belirleyin (${active} / ${total} etkin)`,
    selectAll: 'Tümünü Seç',
    clearAll: 'Tümünü Temizle',
    statusActive: 'ETKİN',
    statusOff: 'KAPALI',

    // Ready & start states
    pleaseSelectChordAlert: 'Lütfen başlamak için yukarıdan en az bir akor türü seçin.',
    pleaseSelectIntervalAlert: 'Lütfen başlamak için yukarıdan en az bir aralık seçin.',
    readyWithChords: (count) => `${count} etkin akor türü ile hazır.`,
    readyWithIntervals: (count) => `${count} etkin aralık ile hazır.`,
    startChordQuiz: 'Akor Testini Başlat',
    restartChordQuiz: 'Seçimle Yeniden Başlat',
    startIntervalQuiz: 'Aralık Testini Başlat',
    restartIntervalQuiz: 'Seçimle Yeniden Başlat',
    audioErrorNotice:
      'Ses çalınabilmesi için kullanıcı etkileşimi gerekir. Lütfen "Sesi Tekrar Dinle" butonuna dokunun.',

    // Mistakes Module (Türkçe)
    mistakesTab: 'Hatalarım',
    mistakesTitle: 'Hata Kayıtları & Analiz',
    mistakesSubtitle: 'Akor testlerindeki hatalarınız yalnızca tarayıcınızda yerel olarak saklanır',
    totalMistakesLabel: 'Toplam Hata',
    mostMissedChordLabel: 'En Çok Karıştırılan Akor',
    lastMistakeDateLabel: 'Son Hata Tarihi',
    uniqueChordsMissedLabel: 'Hata Yapılan Akor Türü',
    mistakeDistributionTitle: 'Akor Türüne Göre Hata Dağılımı',
    mistakeDistributionSubtitle: 'Her akor türünün toplam hatalar içindeki yüzdelik dağılımı',
    rankedMistakesTitle: 'Hata Listesi',
    rankedMistakesSubtitle: 'Hata sıklığına göre sıralı döküm',
    chordTypeHeader: 'Akor Türü',
    formulaHeader: 'Formül',
    mistakeCountHeader: 'Hata Sayısı',
    percentageHeader: 'Oran',
    lastOccurredHeader: 'Son Oluşum',
    clearMistakesButton: 'Hataları Temizle',
    confirmClearTitle: 'Hata Kayıtları Temizlensin mi?',
    confirmClearMessage: 'Tarayıcınızda kayıtlı olan tüm akor hatalarını sıfırlamak istediğinizden emin misiniz? Bu işlem geri alınamaz.',
    confirmYes: 'Evet, Temizle',
    confirmCancel: 'İptal',
    noMistakesTitle: 'Henüz hiç hata kaydedilmedi',
    noMistakesDescription: 'Akor testinde yanlış bir cevap verdiğinizde, akor türü, hata sayısı ve tarihi burada otomatik olarak kaydedilecektir.',
    neverRecorded: 'Kaydedilmedi',
    timesCount: (count) => `${count} kez`,

    // Footer
    footerText:
      'Akustik Piyano (gerçek piyano kayıtları) & Elektro Piyano (sentetik) · Kök pozisyon akorlar · Çıkıcı & inici aralıklar',
  },
};

/**
 * Chord display name dictionary by language
 */
export const CHORD_LOCALIZATION: Record<
  Language,
  Record<string, { name: string; shortName: string; formula: string; description?: string }>
> = {
  ku: {
    major: {
      name: 'Major',
      shortName: 'Maj',
      formula: '1 3 5',
      description: 'Notaya bingehîn, Sêyema mezin, Pêncema tam [1 3 5]',
    },
    minor: {
      name: 'Mînor',
      shortName: 'Min',
      formula: '1 m3 5',
      description: 'Notaya bingehîn, Sêyema piçûk, Pêncema tam [1 m3 5]',
    },
    diminished: {
      name: 'Kêmkirî (Dim)',
      shortName: 'Dim',
      formula: '1 m3 b5',
      description: 'Notaya bingehîn, Sêyema piçûk, Pêncema kêmkirî [1 m3 b5]',
    },
    augmented: {
      name: 'Zêdekirî (Aug)',
      shortName: 'Aug',
      formula: '1 3 #5',
      description: 'Notaya bingehîn, Sêyema mezin, Pêncema zêdekirî [1 3 #5]',
    },
    major_seventh: {
      name: 'Major heftemîn',
      shortName: 'maj7',
      formula: '1 3 5 M7',
      description: 'Notaya bingehîn, Sêyema mezin, Pêncema tam, Heftema mezin [1 3 5 M7]',
    },
    dominant_seventh: {
      name: 'Domînant heftemîn',
      shortName: '7',
      formula: '1 3 5 m7',
      description: 'Notaya bingehîn, Sêyema mezin, Pêncema tam, Heftema piçûk [1 3 5 m7]',
    },
    minor_seventh: {
      name: 'Mînor heftemîn',
      shortName: 'm7',
      formula: '1 m3 5 m7',
      description: 'Notaya bingehîn, Sêyema piçûk, Pêncema tam, Heftema piçûk [1 m3 5 m7]',
    },
    half_diminished_seventh: {
      name: 'Nîv-kêmkirî heftemîn',
      shortName: 'm7b5',
      formula: '1 m3 b5 m7',
      description: 'Notaya bingehîn, Sêyema piçûk, Pêncema kêmkirî, Heftema piçûk [1 m3 b5 m7]',
    },
  },
  tr: {
    major: {
      name: 'Majör',
      shortName: 'Maj',
      formula: '1 3 5',
      description: 'Kök, Büyük 3\'lü, Tam 5\'li [1 3 5]',
    },
    minor: {
      name: 'Minör',
      shortName: 'Min',
      formula: '1 m3 5',
      description: 'Kök, Küçük 3\'lü, Tam 5\'li [1 m3 5]',
    },
    diminished: {
      name: 'Eksilmiş (Dim)',
      shortName: 'Dim',
      formula: '1 m3 b5',
      description: 'Kök, Küçük 3\'lü, Eksilmiş 5\'li [1 m3 b5]',
    },
    augmented: {
      name: 'Artmış (Aug)',
      shortName: 'Aug',
      formula: '1 3 #5',
      description: 'Kök, Büyük 3\'lü, Artmış 5\'li [1 3 #5]',
    },
    major_seventh: {
      name: 'Majör yedili',
      shortName: 'maj7',
      formula: '1 3 5 M7',
      description: 'Kök, Büyük 3\'lü, Tam 5\'li, Büyük 7\'li [1 3 5 M7]',
    },
    dominant_seventh: {
      name: 'Dominant yedili',
      shortName: '7',
      formula: '1 3 5 m7',
      description: 'Kök, Büyük 3\'lü, Tam 5\'li, Küçük 7\'li [1 3 5 m7]',
    },
    minor_seventh: {
      name: 'Minör yedili',
      shortName: 'm7',
      formula: '1 m3 5 m7',
      description: 'Kök, Küçük 3\'lü, Tam 5\'li, Küçük 7\'li [1 m3 5 m7]',
    },
    half_diminished_seventh: {
      name: 'Yarı-eksilmiş yedili',
      shortName: 'm7b5',
      formula: '1 m3 b5 m7',
      description: 'Kök, Küçük 3\'lü, Eksilmiş 5\'li, Küçük 7\'li [1 m3 b5 m7]',
    },
  },
};

/**
 * Interval display name dictionary by language
 */
export const INTERVAL_LOCALIZATION: Record<
  Language,
  Record<string, { name: string; shortName: string }>
> = {
  ku: {
    minor_second: { name: 'Duyema piçûk', shortName: 'm2' },
    major_second: { name: 'Duyema mezin', shortName: 'M2' },
    minor_third: { name: 'Sêyema piçûk', shortName: 'm3' },
    major_third: { name: 'Sêyema mezin', shortName: 'M3' },
    perfect_fourth: { name: 'Çarema tam', shortName: 'P4' },
    tritone: { name: 'Trîton', shortName: 'TT' },
    perfect_fifth: { name: 'Pêncema tam', shortName: 'P5' },
    minor_sixth: { name: 'Şeşema piçûk', shortName: 'm6' },
    major_sixth: { name: 'Şeşema mezin', shortName: 'M6' },
    minor_seventh: { name: 'Heftema piçûk', shortName: 'm7' },
    major_seventh: { name: 'Heftema mezin', shortName: 'M7' },
    octave: { name: 'Oktav', shortName: 'P8' },
  },
  tr: {
    minor_second: { name: 'Küçük ikili', shortName: 'm2' },
    major_second: { name: 'Büyük ikili', shortName: 'M2' },
    minor_third: { name: 'Küçük üçlü', shortName: 'm3' },
    major_third: { name: 'Büyük üçlü', shortName: 'M3' },
    perfect_fourth: { name: 'Tam dörtlü', shortName: 'T4' },
    tritone: { name: 'Triton', shortName: 'TT' },
    perfect_fifth: { name: 'Tam beşli', shortName: 'T5' },
    minor_sixth: { name: 'Küçük altılı', shortName: 'm6' },
    major_sixth: { name: 'Büyük altılı', shortName: 'M6' },
    minor_seventh: { name: 'Küçük yedili', shortName: 'm7' },
    major_seventh: { name: 'Büyük yedili', shortName: 'M7' },
    octave: { name: 'Oktav', shortName: 'T8' },
  },
};

export function getLocalizedChord(
  chordId: string,
  lang: Language,
  fallbackName: string,
  fallbackShortName: string,
  fallbackDescription: string,
  fallbackFormula: string = ''
) {
  const localized = CHORD_LOCALIZATION[lang]?.[chordId];
  return {
    name: localized?.name || fallbackName,
    shortName: localized?.shortName || fallbackShortName,
    description: localized?.description || fallbackDescription,
    formula: localized?.formula || fallbackFormula,
  };
}

export function getLocalizedInterval(
  intervalId: string,
  lang: Language,
  fallbackName: string,
  fallbackShortName: string
) {
  const localized = INTERVAL_LOCALIZATION[lang]?.[intervalId];
  return {
    name: localized?.name || fallbackName,
    shortName: localized?.shortName || fallbackShortName,
  };
}
