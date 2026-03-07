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

    // Generic interactions
    examine: {
        lines: [
            { text: "*Ничего особенного... или мне так кажется.*", speaker: 'mila' }
        ]
    }
};
