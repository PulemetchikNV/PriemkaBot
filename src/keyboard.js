const kbBtns = require("./kb-btns")

module.exports = {
    role: [
        [kbBtns.role.Auth]
    ],
    admin: [
        [kbBtns.admin.startInv, kbBtns.admin.delInv],
        [kbBtns.admin.inventRes, kbBtns.admin.specInventRes],
        [kbBtns.admin.start, kbBtns.admin.delPriem],
        [kbBtns.admin.result, kbBtns.admin.specRes],
        [kbBtns.admin.showItems, kbBtns.admin.showUsers],
        [kbBtns.admin.delItem, kbBtns.admin.addItem],
        [kbBtns.admin.delUser, kbBtns.admin.addUser], 
    ],
    receiver: [
        [kbBtns.receiver.startInv],
        [kbBtns.receiver.start],
        [kbBtns.receiver.res]
    ],
    priemka: [
        [kbBtns.priemka.end],
        [kbBtns.priemka.res],
        [kbBtns.priemka.addItem, kbBtns.priemka.changeCount]
    ],
    invent: [
        [kbBtns.invent.end],
        [kbBtns.invent.res],
        [kbBtns.invent.addItem, kbBtns.invent.changeCount]
    ],
    back: [
        [kbBtns.back.back]
    ],
    apply: [
        [kbBtns.apply.apply, kbBtns.apply.back]
    ],
    months: [
        [kbBtns.month.jan, kbBtns.month.feb, kbBtns.month.mar],
        [kbBtns.month.apr, kbBtns.month.may, kbBtns.month.jun],
        [kbBtns.month.jul, kbBtns.month.aug, kbBtns.month.sep],
        [kbBtns.month.oct, kbBtns.month.nov, kbBtns.month.dec],
        [kbBtns.back.back]
    ]
}