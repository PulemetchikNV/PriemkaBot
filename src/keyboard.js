const kbBtns = require("./kb-btns")

module.exports = {
    role: [
        [kbBtns.role.Auth]
    ],
    admin: [
        [kbBtns.admin.delItem, kbBtns.admin.addItem],
        [kbBtns.admin.delUser], 
    ],
    receiver: [
        [kbBtns.receiver.start],
        [kbBtns.receiver.res]
    ],
    priemka: [
        [kbBtns.priemka.end],
        [kbBtns.priemka.res],
        [kbBtns.priemka.addItem, kbBtns.priemka.changeCount]
    ],
    back: [
        [kbBtns.back.back]
    ],
    apply: [
        [kbBtns.apply.apply, kbBtns.apply.back]
    ]
}