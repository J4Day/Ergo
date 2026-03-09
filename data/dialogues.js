const DIALOGUES = {
    // White Room
    whiteRoomNote: {
        lines: [
            { text: "*На полу лежит записка. Почерк знакомый... мой?*", speaker: 'narrator' },
            { text: '"Ты выбрала быть здесь. Вспомни - почему."', speaker: 'narrator' }
        ]
    },
    whiteRoomWake: {
        lines: [
            { text: "*Где я?.. Белые стены. Белый потолок. Ничего больше.*", speaker: 'mila' },
            { text: "*Голова тяжёлая. Кажется, я спала очень долго.*", speaker: 'mila' },
            { text: "*Впереди дверь. Единственная дверь.*", speaker: 'mila' }
        ]
    },
    whiteRoomReturn: {
        lines: [
            { text: "*Снова эта комната... Но что-то изменилось.*", speaker: 'mila' },
            { text: "*Трещины на стенах. Их раньше не было... или были?*", speaker: 'mila' }
        ]
    },

    // Corridor
    doctorFirst: {
        lines: [
            { text: "Ты пришла. Хорошо.", speaker: 'doctor' },
            { text: "*Его лицо... я не могу разглядеть его лицо.*", speaker: 'mila' },
            { text: "Двери перед тобой. Каждая - это то, что ты забыла.", speaker: 'doctor' },
            { text: "Или то, что ты хочешь забыть.", speaker: 'doctor' },
            { text: "Выбор за тобой. Он всегда был за тобой.", speaker: 'doctor' }
        ]
    },
    doctorHint: {
        lines: [
            { text: "Помни: то, что ты видишь там - уже прошло.", speaker: 'doctor' },
            { text: "Оно не может причинить тебе боль.", speaker: 'doctor' },
            { text: "Если ты не позволишь.", speaker: 'doctor' }
        ]
    },
    corridorDoorLocked: {
        lines: [
            { text: "*Дверь не поддаётся. Пока не время.*", speaker: 'mila' }
        ]
    },

    // Apartment
    apartmentEnter: {
        lines: [
            { text: "*Наша квартира... Но всё залито чёрной водой.*", speaker: 'mila' },
            { text: "*Телевизор показывает статику. Мебель покосилась.*", speaker: 'mila' },
            { text: "*На стене - разорванная фотография. Нужно собрать её.*", speaker: 'mila' }
        ]
    },
    apartmentTV: {
        lines: [
            { text: "*Шш-ш-ш... В белом шуме почти можно различить голоса.*", speaker: 'narrator' },
            { text: "*Мамин голос? Нет... это просто шум.*", speaker: 'mila' }
        ]
    },
    apartmentPhotoComplete: {
        lines: [
            { text: "*Фотография собрана. На ней - мама и я. Нам хорошо.*", speaker: 'mila' },
            { text: "*Но это было давно. До того, как всё изменилось.*", speaker: 'mila' }
        ]
    },
    apartmentChoice: {
        lines: [
            { text: "*Это воспоминание... Мама уходит. Дверь хлопает.*", speaker: 'mila' },
            { text: "*Я помню этот звук. Он преследовал меня годами.*", speaker: 'mila' }
        ],
        choice: {
            prompt: "Принять это воспоминание?",
            options: [
                { text: "Принять. Она ушла. Это больно, но это правда.", flag: 'memoryApartment', value: true },
                { text: "Забыть. Я не хочу это помнить.", flag: 'memoryApartment', value: false }
            ]
        }
    },

    // School
    schoolEnter: {
        lines: [
            { text: "*Школьные коридоры. Бесконечные, одинаковые.*", speaker: 'mila' },
            { text: "*Тени учеников скользят мимо. У них нет лиц.*", speaker: 'mila' },
            { text: "*Где-то играет мелодия... Если следовать за ней...*", speaker: 'mila' }
        ]
    },
    schoolLittleMila: {
        lines: [
            { text: "*Маленькая девочка в красном платье. Это... я?*", speaker: 'mila' },
            { text: "Ты опять заблудилась? Я нарисовала тебе дорогу!", speaker: 'littleMila' },
            { text: "*На стене - детские рисунки. Стрелки, указывающие путь.*", speaker: 'mila' }
        ]
    },
    schoolChoice: {
        lines: [
            { text: "*Я вспоминаю. Смех за спиной. Записки на парте.*", speaker: 'mila' },
            { text: '*"Странная". "Ненормальная". Каждый день.*', speaker: 'mila' },
            { text: "*Я прятала слёзы в туалете. Никто не замечал.*", speaker: 'mila' }
        ],
        choice: {
            prompt: "Принять это воспоминание?",
            options: [
                { text: "Принять. Мне было больно, но я выжила.", flag: 'memorySchool', value: true },
                { text: "Забыть. Они не стоят моих слёз.", flag: 'memorySchool', value: false }
            ]
        }
    },

    // Garden
    gardenEnter: {
        lines: [
            { text: "*Мёртвый сад. Красное небо. Пепел вместо снега.*", speaker: 'mila' },
            { text: "*Посреди сада - могила без имени.*", speaker: 'mila' },
            { text: "*Вокруг - четыре пустых клумбы. Что-то нужно посадить.*", speaker: 'mila' }
        ]
    },
    gardenGrave: {
        lines: [
            { text: "*Могильный камень пуст. Ни имени, ни дат.*", speaker: 'narrator' },
            { text: "*Почему мне так страшно?*", speaker: 'mila' }
        ]
    },
    gardenFlowerPlanted: {
        lines: [
            { text: "*Цветок прорастает сквозь пепел. Маленький. Живой.*", speaker: 'narrator' }
        ]
    },
    gardenChoice: {
        lines: [
            { text: "*Все четыре цветка расцвели. Могила... на ней появилось имя.*", speaker: 'mila' },
            { text: "*Моё имя.*", speaker: 'mila' },
            { text: "*Я вспоминаю. Крышу. Ветер. Край.*", speaker: 'mila' },
            { text: "*Момент, когда я решила...*", speaker: 'mila' }
        ],
        choice: {
            prompt: "Принять это воспоминание?",
            options: [
                { text: "Принять. Это было. Но я ещё здесь.", flag: 'memoryGarden', value: true },
                { text: "Забыть. Это не я. Больше не я.", flag: 'memoryGarden', value: false }
            ]
        }
    },

    // Hospital
    hospitalEnter: {
        lines: [
            { text: "*Больничная палата. Но всё не так.*", speaker: 'mila' },
            { text: "*Кровать на потолке. Стены дышат. Капельница течёт вверх.*", speaker: 'mila' },
            { text: "*Нужно привести комнату в порядок.*", speaker: 'mila' }
        ]
    },
    hospitalMother: {
        lines: [
            { text: "*Женщина у окна. Спиной ко мне.*", speaker: 'mila' },
            { text: "Мама?", speaker: 'mila' },
            { text: "*Она не поворачивается. Но я слышу...*", speaker: 'narrator' },
            { text: "*...плач.*", speaker: 'narrator' }
        ]
    },
    hospitalChoice: {
        lines: [
            { text: "*Комната выпрямляется. Я вижу себя на кровати.*", speaker: 'mila' },
            { text: "*Капельница. Мониторы. Бип... бип... бип...*", speaker: 'mila' },
            { text: "*Я в коме. Это всё... моё подсознание.*", speaker: 'mila' },
            { text: "*Мама сидит рядом. Она не уходила. Она здесь.*", speaker: 'mila' }
        ],
        choice: {
            prompt: "Принять это воспоминание?",
            options: [
                { text: "Принять. Она здесь. Она ждёт.", flag: 'memoryHospital', value: true },
                { text: "Забыть. Я не заслуживаю её слёз.", flag: 'memoryHospital', value: false }
            ]
        }
    },

    // Void
    voidEnter: {
        lines: [
            { text: "*Пустота. Ничего, кроме темноты.*", speaker: 'mila' },
            { text: "*И... она.*", speaker: 'mila' }
        ]
    },
    shadowSpeak: {
        lines: [
            { text: "Ты знаешь, кто я.", speaker: 'shadow' },
            { text: "*Мой силуэт. Мои глаза. Но... пустые.*", speaker: 'mila' },
            { text: "Я - то, от чего ты бежишь.", speaker: 'shadow' },
            { text: "Я - причина, по которой ты здесь.", speaker: 'shadow' }
        ]
    },
    voidChoice: {
        lines: [
            { text: "Ты помнишь теперь? Помнишь, почему?", speaker: 'shadow' },
            { text: "*Да. Я помню всё.*", speaker: 'mila' },
            { text: "Тогда выбирай.", speaker: 'shadow' }
        ],
        choice: {
            prompt: "Что ты скажешь Тени?",
            options: [
                { text: "Ты - часть меня. Но ты не всё, что я есть.", flag: 'memoryVoid', value: true },
                { text: "Ты права. Я не должна была выживать.", flag: 'memoryVoid', value: false }
            ]
        }
    },

    // Endings
    endingAwakening: {
        lines: [
            { text: "*Тень рассыпается на пиксели.*", speaker: 'narrator' },
            { text: "*Белая комната наполняется светом.*", speaker: 'narrator' },
            { text: "*Я слышу мамин голос. Писк мониторов. Запах больницы.*", speaker: 'mila' },
            { text: "*Мои пальцы шевелятся.*", speaker: 'mila' },
            { text: "*Я открываю глаза.*", speaker: 'mila' },
            { text: "Мила?! Доктор! Она очнулась!", speaker: 'mother' },
            { text: "*Свет слепит. Но это настоящий свет.*", speaker: 'mila' },
            { text: "*Я выбираю жить.*", speaker: 'mila' }
        ]
    },
    endingOblivion: {
        lines: [
            { text: "*Тень улыбается.*", speaker: 'narrator' },
            { text: "*Белая комната сжимается.*", speaker: 'narrator' },
            { text: "*Стены ближе. Потолок ниже.*", speaker: 'mila' },
            { text: "*Всё меньше. Всё темнее.*", speaker: 'mila' },
            { text: "*Точка.*", speaker: 'narrator' }
        ]
    },
    endingLoop: {
        lines: [
            { text: "*Тень исчезает. Но не рассыпается - растворяется.*", speaker: 'narrator' },
            { text: "*Я снова в белой комнате.*", speaker: 'mila' },
            { text: "*Записка на полу. Тот же почерк.*", speaker: 'mila' },
            { text: '"Ты выбрала быть здесь. Вспомни - почему."', speaker: 'narrator' },
            { text: "*Но на стене... новая трещина.*", speaker: 'mila' },
            { text: "*Может, в этот раз...*", speaker: 'mila' }
        ]
    },

    // Shadow encounters
    shadowChase: {
        lines: [
            { text: "*Холод. Она здесь.*", speaker: 'mila' }
        ]
    },
    shadowCatch: {
        lines: [
            { text: "*Темнота обволакивает... Не могу дышать...*", speaker: 'mila' },
            { text: "Ты думала, можно убежать от себя?", speaker: 'shadow' },
            { text: "*Боль отступает. Но страх остаётся.*", speaker: 'mila' }
        ]
    },
    shadowStalking: {
        lines: [
            { text: "*За спиной... что-то шевелится.*", speaker: 'mila' },
            { text: "*Не оборачивайся. Не оборачивайся.*", speaker: 'mila' }
        ]
    },
    shadowWhisperText: {
        lines: [
            { text: "...тебе не станет лучше...", speaker: 'shadow' }
        ]
    },

    // Secret Ending D: Forgiveness
    endingForgiveness: {
        lines: [
            { text: "*Тень смотрит на меня. Я смотрю на неё.*", speaker: 'narrator' },
            { text: "*Мы одинаковые. Мы всегда были одинаковые.*", speaker: 'mila' },
            { text: "Ты... не боишься?", speaker: 'shadow' },
            { text: "*Нет. Не больше.*", speaker: 'mila' },
            { text: "*Я протягиваю руку. Тень отступает.*", speaker: 'narrator' },
            { text: "Не надо. Ты не знаешь, что я...", speaker: 'shadow' },
            { text: "Я знаю. Ты — моя боль. Моё одиночество. Мой страх.", speaker: 'mila' },
            { text: "И я прощаю тебя.", speaker: 'mila' },
            { text: "*Тень дрожит. Пиксели расплываются.*", speaker: 'narrator' },
            { text: "*Она не исчезает. Она становится частью меня.*", speaker: 'mila' },
            { text: "*Мы — одно. Мы всегда были одно.*", speaker: 'mila' },
            { text: "*Свет. Мамин голос. Писк мониторов.*", speaker: 'narrator' },
            { text: "*Я открываю глаза. И впервые — не боюсь.*", speaker: 'mila' }
        ]
    },

    // Doctor's secret
    doctorSecret: {
        lines: [
            { text: "Ты хочешь знать, кто я?", speaker: 'doctor' },
            { text: "Посмотри внимательно.", speaker: 'doctor' },
            { text: "*Его лицо... мерцает. За ним — ничего.*", speaker: 'mila' },
            { text: "Я — не человек. Я — то, что тебе нужно.", speaker: 'doctor' },
            { text: "Проекция. Часть твоего разума, которая хочет жить.", speaker: 'doctor' },
            { text: "Та часть, которая вызвала скорую.", speaker: 'doctor' },
            { text: "*...после того, как я прыгнула.*", speaker: 'mila' },
            { text: "Я не могу вести тебя. Только направлять.", speaker: 'doctor' },
            { text: "Остальное — твой выбор. Он всегда был твоим.", speaker: 'doctor' }
        ]
    },

    // Little Mila random appearances
    littleMilaRandom: {
        lines: [
            { text: "*Маленькая девочка в красном. Она машет мне.*", speaker: 'narrator' },
            { text: "Ты помнишь, как мы играли?", speaker: 'littleMila' },
            { text: "*Она исчезает прежде, чем я успеваю ответить.*", speaker: 'mila' }
        ]
    },

    // === NEW EXPANDED DIALOGUES ===

    // Apartment — mirror interaction
    apartmentMirror: {
        lines: [
            { text: "*Зеркало в ванной. Покрыто трещинами.*", speaker: 'narrator' },
            { text: "*Моё отражение... оно не двигается вместе со мной.*", speaker: 'mila' },
            { text: "*Оно смотрит. Оно знает.*", speaker: 'mila' }
        ]
    },

    // Apartment — window interaction
    apartmentWindow: {
        lines: [
            { text: "*За окном — дождь. Бесконечный, чёрный дождь.*", speaker: 'narrator' },
            { text: "*Когда-то я любила дождь. Мы с бабушкой слушали его вместе.*", speaker: 'mila' },
            { text: "*Теперь он звучит как... плач.*", speaker: 'mila' }
        ]
    },

    // Apartment — radio
    apartmentRadio: {
        lines: [
            { text: "*Радио. Сквозь шум — обрывки слов.*", speaker: 'narrator' },
            { text: "*\"...состояние стабильное... мозговая активность...\"*", speaker: 'radio' },
            { text: "*Это обо мне? Кто-то говорит обо мне... в реальности?*", speaker: 'mila' }
        ]
    },

    // Apartment — clock
    apartmentClock: {
        lines: [
            { text: "*Часы на стене. Стрелки идут в обратную сторону.*", speaker: 'narrator' },
            { text: "*Время здесь не имеет значения. Или наоборот — только оно и имеет.*", speaker: 'mila' }
        ]
    },

    // School — locker interaction
    schoolLocker: {
        lines: [
            { text: "*Шкафчик. На дверце нацарапано: \"Мила = 0\"*", speaker: 'narrator' },
            { text: "*Я помню, кто написал это. Я помню каждый день.*", speaker: 'mila' }
        ]
    },

    // School — blackboard
    schoolBlackboard: {
        lines: [
            { text: "*На доске написано мелом, снова и снова:*", speaker: 'narrator' },
            { text: "*\"Я ЗДЕСЬ Я ЗДЕСЬ Я ЗДЕСЬ Я ЗДЕСЬ Я ЗДЕСЬ\"*", speaker: 'narrator' },
            { text: "*Мой почерк. Моя мольба, которую никто не слышал.*", speaker: 'mila' }
        ]
    },

    // School — phone ringing
    schoolPhone: {
        lines: [
            { text: "*Телефон в учительской звонит. Никто не берёт.*", speaker: 'narrator' },
            { text: "*Как тот звонок маме, который я так и не сделала.*", speaker: 'mila' }
        ]
    },

    // Garden — bench interaction
    gardenBench: {
        lines: [
            { text: "*Скамейка. Старая, покосившаяся.*", speaker: 'narrator' },
            { text: "*Мы сидели здесь с бабушкой. Она вязала, я рисовала.*", speaker: 'mila' },
            { text: "*\"Ты талантливая, Милочка. Не слушай других.\"*", speaker: 'mila' },
            { text: "*Я перестала рисовать после её смерти.*", speaker: 'mila' }
        ]
    },

    // Garden — pond
    gardenPond: {
        lines: [
            { text: "*Маленький пруд. Вода чёрная, непрозрачная.*", speaker: 'narrator' },
            { text: "*В воде отражается не моё лицо. Или... моё, но другое.*", speaker: 'mila' },
            { text: "*Моложе. Счастливее. Та, кем я могла бы быть.*", speaker: 'mila' }
        ]
    },

    // Hospital — IV drip
    hospitalIV: {
        lines: [
            { text: "*Капельница. Жидкость течёт вверх, против гравитации.*", speaker: 'narrator' },
            { text: "*В реальности — она течёт в мои вены. Поддерживает жизнь.*", speaker: 'mila' },
            { text: "*Жизнь, которую я пыталась прервать.*", speaker: 'mila' }
        ]
    },

    // Hospital — medical records
    hospitalRecords: {
        lines: [
            { text: "*Папка с документами. Мой диагноз.*", speaker: 'narrator' },
            { text: "*\"Тяжёлый депрессивный эпизод. Суицидальная попытка.\"*", speaker: 'narrator' },
            { text: "*\"Перелом позвоночника. Черепно-мозговая травма.\"*", speaker: 'narrator' },
            { text: "*\"Прогноз: неопределённый.\"*", speaker: 'narrator' },
            { text: "*Я прыгнула с крыши. И выжила. Почему?*", speaker: 'mila' }
        ]
    },

    // Corridor — window (new object)
    corridorWindow: {
        lines: [
            { text: "*Окно в стене коридора. За ним — белая пустота.*", speaker: 'narrator' },
            { text: "*Иногда мне кажется, что я вижу там лица.*", speaker: 'mila' },
            { text: "*Врачи? Медсёстры? Мама?*", speaker: 'mila' }
        ]
    },

    // Corridor — crack in wall
    corridorCrack: {
        lines: [
            { text: "*Трещина в стене. Через неё слышен шёпот.*", speaker: 'narrator' },
            { text: "*\"...давление стабильное... зрачки реагируют...\"*", speaker: 'narrator' },
            { text: "*Реальность просачивается сюда. Мир снаружи — ждёт.*", speaker: 'mila' }
        ]
    },

    // Doctor — more talks
    doctorTalk2: {
        lines: [
            { text: "Ты возвращаешься. Это хорошо.", speaker: 'doctor' },
            { text: "Каждая дверь — это часть тебя. Часть, которую ты потеряла.", speaker: 'doctor' },
            { text: "Или спрятала.", speaker: 'doctor' },
            { text: "*Его голос... он как эхо моих собственных мыслей.*", speaker: 'mila' }
        ]
    },
    doctorTalk3: {
        lines: [
            { text: "Ты знаешь, почему Тень преследует тебя?", speaker: 'doctor' },
            { text: "*...*", speaker: 'mila' },
            { text: "Потому что ты бежишь от себя. А от себя не убежать.", speaker: 'doctor' },
            { text: "Можно только принять. Или сломаться.", speaker: 'doctor' }
        ]
    },
    doctorTalk4: {
        lines: [
            { text: "В реальности прошло одиннадцать дней.", speaker: 'doctor' },
            { text: "*Одиннадцать?.. Мне казалось — вечность.*", speaker: 'mila' },
            { text: "Время здесь... гибкое. Как и память.", speaker: 'doctor' },
            { text: "Твоя мать не уходит из палаты. Ни на минуту.", speaker: 'doctor' }
        ]
    },

    // Shadow — additional whispers during chase
    shadowWhisper1: {
        lines: [
            { text: "*...никто тебя не любит...*", speaker: 'shadow' }
        ]
    },
    shadowWhisper2: {
        lines: [
            { text: "*...ты сама виновата...*", speaker: 'shadow' }
        ]
    },
    shadowWhisper3: {
        lines: [
            { text: "*...мир без тебя не изменится...*", speaker: 'shadow' }
        ]
    },
    shadowWhisper4: {
        lines: [
            { text: "*...даже мама устала от тебя...*", speaker: 'shadow' }
        ]
    },

    // Mother — expanded dialogues
    motherTalk2: {
        lines: [
            { text: "*Она поворачивается. Лицо... размыто, но я вижу слёзы.*", speaker: 'narrator' },
            { text: "Милочка, прости меня.", speaker: 'mother' },
            { text: "Я не должна была уезжать. Не должна была оставлять тебя.", speaker: 'mother' },
            { text: "*Мам...*", speaker: 'mila' },
            { text: "Я думала — работа, деньги, лучшая жизнь для тебя...", speaker: 'mother' },
            { text: "А ты просто хотела, чтобы я была рядом.", speaker: 'mother' }
        ]
    },

    // Void — shadow additional lines before choice
    shadowPhilosophy: {
        lines: [
            { text: "Ты думаешь, принять — значит простить?", speaker: 'shadow' },
            { text: "Простить тех, кто издевался? Мать, которая бросила?", speaker: 'shadow' },
            { text: "*Нет. Принять — значит перестать ненавидеть себя за то, что я чувствовала.*", speaker: 'mila' },
            { text: "...Интересно.", speaker: 'shadow' }
        ]
    },

    // White room — deeper decay dialogues
    whiteRoomDecay3: {
        lines: [
            { text: "*Стены трескаются. Сквозь трещины — темнота.*", speaker: 'narrator' },
            { text: "*И голоса. Реальные голоса.*", speaker: 'mila' },
            { text: "*\"...мозговая активность возросла... она борется...\"*", speaker: 'narrator' }
        ]
    },
    whiteRoomDecay5: {
        lines: [
            { text: "*Белая комната почти разрушена. Пол проваливается.*", speaker: 'narrator' },
            { text: "*Я вижу... больничный потолок? Лампу?*", speaker: 'mila' },
            { text: "*Почти... почти могу открыть глаза...*", speaker: 'mila' }
        ]
    },

    // Generic interactions
    examine: {
        lines: [
            { text: "*Ничего особенного... или мне так кажется.*", speaker: 'mila' }
        ]
    }
};
