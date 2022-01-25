const kbBtns = require("./kb-btns")

module.exports = {
    role: [
        [kbBtns.role.Auth]
    ],
    admin: [
        [kbBtns.admin.delItem, kbBtns.admin.addItem],
        [kbBtns.admin.delUser], 
    ],
    back: [
        [kbBtns.back.back]
    ]
}