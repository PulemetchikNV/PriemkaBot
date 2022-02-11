const { Scenes:{BaseScene, Stage}, session, Telegraf, Markup } = require('telegraf');
const mysql = require('mysql')
const helper = require('./helper')
const config = require('./config')
const kb = require('./keyboard')
const kbBtns = require("./kb-btns");
// const conn = mysql.createConnection({
//     host: '127.0.0.1',
//     user: "mysqladmin",
//     database: "priemkabot",
//     password: "root",
//     socketPath : '/run/mysqld/mysqld.sock'
// })
const conn = mysql.createConnection({
    host: 'localhost',
    user: "root",
    database: "priemkabot",
    password: "password",
})
conn.connect(err =>{
    if(err){
        console.log(err)
    }else{
        console.log('Database ------ ok');
    }
})
const selectFromUsers = 'SELECT * FROM users' 

const bot = new Telegraf(config.TOKEN)

const DelUser = DelUserScene()
const requestUserID = requestUserIDScene()
const requestUserName = requestUserNameScene()
const requestUserRole = requestUserRoleScene()
const requestUserChatID = requestUserChatIDScene()
const requestPriemID = requestPriemIDscene()

const deletePriem = deletePriemScene()
const confirmDelete = confirmDeleteScene()

const AddUser = AddUserScene()
const DelItem = DelItemScene()

const requestMonth = requestMonthScene()
const requestYear = requestYearScene()
const adm_requestName = nameScene('Admin',AdminFunctional)
const adm_requestCount = countScene('Admin',AdminFunctional) 
const adm_requestCode = codeScene('Admin',AdminFunctional)
const adm_addData = addScene('Admin',AdminFunctional)

const startAdmPriemka = startScene('Admin', AdminFunctional, 'priemka')
const startRecPriemka = startScene('Priemka', ReceiverFunctional, 'priemka')

const startAdmInvent = startScene('Admin', AdminFunctional, 'invent')
const startRecInvent = startScene('Priemka', ReceiverFunctional, 'invent')

const rec_requestName = nameScene('Priemka',PriemkaFunctional)
const rec_requestCount = countScene('Priemka',PriemkaFunctional) 
const rec_requestCode = codeScene('Priemka',PriemkaFunctional)
const rec_addData = addScene('Priemka',PriemkaFunctional)
const adm_barChange = barChangeScene('Admin')
const rec_barChange = barChangeScene('Priemka')
const operator = operatorScene() 
const howMuchCodes = howMuchCodesScene()
const adm_PriemRes = PriemResScene('Admin', 'priemka')
const adm_InventRes = PriemResScene('Admin', 'invent')
const rec_PriemRes = PriemResScene('Priemka', 'priemka')
const rec_InventRes = PriemResScene('Priemka', 'invent')
const stage = new Stage([
    DelUser,
    requestUserID,
    requestUserName,
    requestUserRole, 
    requestUserChatID,
    requestPriemID,
    deletePriem,
    confirmDelete,
    AddUser,
    DelItem, 
    requestMonth,
    requestYear,
    adm_requestName,
    adm_requestCount, 
    adm_requestCode, 
    adm_addData, 
    rec_requestName,
    rec_requestCount,
    rec_requestCode,
    rec_addData,
    startAdmPriemka,
    startRecPriemka,
    adm_barChange,
    rec_barChange,
    operator,
    howMuchCodes,
    adm_PriemRes,
    rec_PriemRes,
    adm_InventRes,
    rec_InventRes,
    startAdmInvent,
    startRecInvent
])

bot.use(session())
bot.use(stage.middleware())

bot.on("message", ctx=>{
    const userId = ctx.update.message.from['id']
    const text = ctx.update.message.text
    getRole(function (err, results) {
        if(err){
            console.log("ERR:",err);
        }else{
            for(let result of results){  
//======================ADMIN====================================
                if(result['user_role'] == 'Admin' && result['user_id'] == userId){
                    ctx.session.isStarted = false
                    switch(text){
                        case '/start':
                            ctx.reply("Вы вошли как администратор, Действия администратора:", Markup.keyboard(kb.admin))
                            break
                        case kbBtns.admin.startInv:
                            ctx.session.AdminID = result['user_id']
                            conn.query(`select * from invent where invent_status = 'Active'`, (err, ACTresult)=>{
                                if(err){
                                    console.log(err);
                                }else{
                                    if(!ACTresult[0]){
                                        ctx.session.BarCount = {
                                        }
                                        ctx.session.BarCount['Всего'] = 0
                                        conn.query('select item_barcode from items', (err, results)=>{
                                            if(err){
                                                console.log(err);
                                            }else{
                                                for(let result of results){
                                                    ctx.session.BarCount[`${result['item_barcode']}`] = 0
                                                }
                                            }
                                        })
                                        const RawDate = new Date()
                                        const date = `${RawDate.getDate()}.${RawDate.getMonth() + 1}.${RawDate.getFullYear()}`
                                        let status = 'Active'
                                        const name = result['user_name']
                                        conn.query(`insert into invent(invent_date, invent_status, invent_reciever) values('${date}', '${status}', '${name}')`, (err, result)=> {
                                            if(err){
                                                console.log(err);
                                            }else{
                                                for(let result of results){
                                                    if(result['user_role'] === 'Admin' && result['user_id'] != ctx.session.AdminID){
                                                        ctx.telegram.sendMessage(result['user_chatId'], `Инвентаризация за ${date} открыта пользователем ${name}`)
                                                    }
                                                }
                                            }
                                        })
                                        conn.query(`select invent_id from invent where invent_status = 'Active'`, (err, ACresult)=>{
                                            if(err){
                                                console.log(err);
                                            }else{
                                                ctx.session.id = ACresult[0]['invent_id']
                                            }
                                        })
                                        ctx.reply(`Дата инвентаризации: ${date}`)
                                        ctx.reply('Инвентаризация начата', Markup.keyboard(kb.invent))
                                        ctx.session.isStarted = true
                                        ctx.scene.enter('startScene(Admin,invent)')
                                    }else{
                                        ctx.reply('Похоже, сейчас активна другая инвентаризация, сначала нужно завершить её')
                                    }
                                }
                            })
                            break
                        case kbBtns.admin.delInv:
                            ctx.session.type = 'invent'
                            ctx.scene.enter('deletePriem')
                            break
                        case kbBtns.admin.inventRes:
                            ctx.session.type = 'invent'
                            ctx.scene.enter('requestMonth')
                            break

                        case kbBtns.admin.specInventRes:
                            ctx.session.type = 'invent'
                            ctx.scene.enter('requestPriem')
                            break
                        case kbBtns.admin.start:
                            ctx.session.AdminID = result['user_id']
                            conn.query(`select * from priemka where priemka_status = 'Active'`, (err, ACTresult)=>{
                                if(err){
                                    console.log(err);
                                }else{
                                    if(!ACTresult[0]){
                                        ctx.session.BarCount = {
                                        }
                                        ctx.session.BarCount['Всего'] = 0
                                        conn.query('select item_barcode from items', (err, results)=>{
                                            if(err){
                                                console.log(err);
                                            }else{
                                                for(let result of results){
                                                    ctx.session.BarCount[`${result['item_barcode']}`] = 0
                                                }
                                            }
                                        })
                                        const RawDate = new Date()
                                        const date = `${RawDate.getDate()}.${RawDate.getMonth() + 1}.${RawDate.getFullYear()}`
                                        let status = 'Active'
                                        const name = result['user_name']
                                        conn.query(`insert into priemka(priemka_date, priemka_status, priemka_reciever) values('${date}', '${status}', '${name}')`, (err, result)=> {
                                            if(err){
                                                console.log(err);
                                            }else{
                                                for(let result of results){
                                                    if(result['user_role'] === 'Admin' && result['user_id'] != ctx.session.AdminID){
                                                        ctx.telegram.sendMessage(result['user_chatId'], `Приёмка за ${date} открыта пользователем ${name}`)
                                                    }
                                                }
                                            }
                                        })
                                        conn.query(`select priemka_id from priemka where Priemka_status = 'Active'`, (err, ACresult)=>{
                                            if(err){
                                                console.log(err);
                                            }else{
                                                ctx.session.id = ACresult[0]['priemka_id']
                                            }
                                        })
                                        ctx.reply(`Дата приёмки: ${date}`)
                                        ctx.reply('Приёмка начата', Markup.keyboard(kb.priemka))
                                        ctx.session.isStarted = true
                                        ctx.scene.enter('startScene(Admin,priemka)')
                                    }else{
                                        ctx.reply('Похоже, сейчас активна другая приёмка, сначала нужно завершить её')
                                    }
                                }
                            })
                            break
                        case kbBtns.admin.delPriem:
                            ctx.session.type = 'priemka'
                            ctx.scene.enter('deletePriem')
                            break
                        case kbBtns.admin.result:
                            ctx.session.type = 'priemka'
                            ctx.scene.enter('requestMonth')
                            
                            break
                        case kbBtns.admin.specRes:
                            ctx.session.type = 'priemka'
                            ctx.scene.enter('requestPriem')
                            break
                        case kbBtns.admin.showItems:
                            conn.query('select * from items', (err, ITEMres)=>{
                                if(err){
                                    console.log(err);
                                }else{
                                    let items = ''
                                    let count = 0
                                    for(let value of Object.keys(ITEMres)){
                                        count += 1
                                        items += `${count}.${ITEMres[value]['item_name']}, ${ITEMres[value]['item_count']} шт., Штрихкод: ${ITEMres[value]['item_barcode']}\n\n`
                                    }
                                    if(items){
                                        ctx.reply(items)
                                    }else{
                                        ctx.reply('База данных пуста')
                                    }
                                }
                            })
                            break
                        case kbBtns.admin.showUsers:
                            conn.query('select * from users', (err, USERres)=>{
                                if(err){
                                    console.log(err);
                                }else{
                                    let users = ''
                                    let count = 0
                                    let role
                                    for(let value of Object.keys(USERres)){
                                        count += 1
                                        if(USERres[value]['user_role'] == 'Admin'){
                                            role = 'Администратор'
                                        }else{
                                            role = 'Приёмщик'
                                        }
                                        users += `${count}) User ID пользователя: ${USERres[value]['user_id']},\n ФИО: ${USERres[value]['user_name']},\n Должность: ${role},\n Chat ID пользователя ${USERres[value]['user_chatId']} \n\n`
                                    }
                                    ctx.reply(users)
                                }
                            })
                            break
                        case kbBtns.admin.delUser:
                            ctx.scene.enter('DELuser')
                            break
                        case kbBtns.admin.addUser:
                            
                            ctx.scene.enter('requestUserID')
                            break
                        case kbBtns.admin.delItem:
                            ctx.scene.enter('delItem')
                            break
                        case kbBtns.admin.addItem:
                            ctx.scene.enter('nameScene(Admin)')
                            break
                        default:     
                                setTimeout(()=>{
                                    AdminFunctional(ctx)
                                }, 10)
                                break
                    }
//======================RECEIVER===================================
                }else if(result['user_role'] == 'Receiver' && result['user_id'] == userId){
                    switch(text){
                        case '/start':
                            ctx.reply("Вы вошли как приёмщик, действия приёмщика:", Markup.keyboard(kb.receiver))
                            break
                        case kbBtns.receiver.start:
                            
                            conn.query(`select * from priemka where priemka_status = 'Active'`, (err, ACTresult)=>{
                                if(err){
                                    console.log(err);
                                }else{
                                    if(!ACTresult[0]){
                                        ctx.session.BarCount = {
                                        }
                                        ctx.session.BarCount['Всего'] = 0
                                        conn.query('select item_barcode from items', (err, results)=>{
                                            if(err){
                                                console.log(err);
                                            }else{
                                                for(let result of results){
                                                    ctx.session.BarCount[`${result['item_barcode']}`] = 0
                                                }
                                            }
                                        })
                                        const RawDate = new Date()
                                        const date = `${RawDate.getDate()}.${RawDate.getMonth() + 1}.${RawDate.getFullYear()}`
                                        let status = 'Active'
                                        const name = result['user_name']
                                        conn.query(`insert into priemka(priemka_date, priemka_status, priemka_reciever) values('${date}', '${status}', '${name}')`, (err, result)=> {
                                            if(err){
                                                console.log(err);
                                            }else{
                                                for(let result of results){
                                                    if(result['user_role'] === 'Admin'){
                                                  
                                                        ctx.telegram.sendMessage(result['user_chatId'], `Приёмка за ${date} открыта пользователем ${name}`)
                                                    }
                                                }
                                            }
                                        })
                                        conn.query(`select priemka_id from priemka where Priemka_status = 'Active'`, (err, ACresult)=>{
                                            if(err){
                                                console.log(err);
                                            }else{
                                                ctx.session.id = ACresult[0]['priemka_id']
                                            }
                                        })
                                        ctx.session.isStarted = true
                                        ctx.reply(`Дата приёмки: ${date}`)
                                        ctx.reply('Приёмка начата', Markup.keyboard(kb.priemka))
                                        ctx.scene.enter('startScene(Priemka,priemka)')
                                    }else{
                                        ctx.reply('Похоже, сейчас активна другая приёмка, сначала нужно завершить её')
                                    }
                                }
                            })
                            break
                        case kbBtns.receiver.res:
                            ctx.session.res = ''
                            conn.query('select max(Priemka_id) from priemka_data', (err, IDResult)=>{
                                if(err){
                                    console.log(err);
                                }else{
                                    const id = IDResult[0]['max(Priemka_id)']
                                    ctx.session.Final = {}  
                                    conn.query(`select * from priemka_data where Priemka_id = ${id}`, (err, DataRes)=>{
                                        if(err){console.log(err)}
                                        else{
                                            for(let res of DataRes){
                                                ctx.session.Final[`${res['Scanned_barcode']}`] = 0
                                            }
                                            for(let res of DataRes){
                                                ctx.session.Final[`${res['Scanned_barcode']}`] += 1
                                            }
                                            sendRes(id, ctx)
                                            

                                        }                             
                                    })     
                                }
                            })
                            break
                        default:     
                            setTimeout(()=>{
                                ReceiverFunctional(ctx)
                            }, 10)
                            break
                    }
                }
            }      
        }
    })
    
})
bot.launch()
//===============================================FUNCTIONS=================================================// 
function AdminFunctional(ctx) {
    setTimeout(()=>{ctx.reply("Действия администратора:", Markup.keyboard(kb.admin))}, 15)
}
function ReceiverFunctional(ctx) {
    setTimeout(()=>{
        ctx.reply("Действия приёмщика:", Markup.keyboard(kb.receiver))
    }, 10)
}
function PriemkaFunctional(ctx) {
    ctx.scene.enter(`startScene(${ctx.session.status},${ctx.session.type})`)
}

function getRole(callback) {
    conn.query(selectFromUsers, (err, results) => {
        if(err){
            callback(err, null);
        }else{
            callback(null, results)
        }
        
    })   
}
function barChanger(conn, ctx) {
    const type = ctx.session.type
    conn.query(`select ${type}_id from ${type} where ${type}_status = 'Active'`, (err, BCresult)=>{
        const operator = ctx.session.operator
        if(err){console.log(err)}
        else{
            ctx.session.id = BCresult[0][`${type}_id`]
            if(operator == '-'){
                let query
                type == 'priemka'?query = 'Scanned_barcode':query = 'invent_barcode'
                conn.query(`delete from ${type}_data where ${type}_id = ${ctx.session.id} and ${query} = '${ctx.session.changeCode}' limit ${ctx.session.changeCount}`, (err, result)=>{
                    if(err){
                        console.log(err);
                        ctx.reply('Неверный формат данных')
                    }else{
                        if(result['affectedRows'] !== 0){
                            if(ctx.session.BarCount[`${ctx.session.changeCode}`] >= ctx.session.changeCount){
                                ctx.session.BarCount[`${ctx.session.changeCode}`] -= ctx.session.changeCount
                            }else{
                                ctx.session.changeCount = ctx.session.BarCount[`${ctx.session.changeCode}`]
                                ctx.session.BarCount[`${ctx.session.changeCode}`] = 0
                            }
                            ctx.session.BarCount['Всего'] -= ctx.session.changeCount
                            ctx.reply('Изменено')
                        }else{
                            ctx.reply('Вы ввели неверный штрихкод')
                        }
                    }
                })
            }else if(operator == '+'){
                for(let i = 0; i < ctx.session.changeCount; i++){
                    conn.query(`insert into ${type}_data values(${ctx.session.id}, '${ctx.session.changeCode}')`, (err, result)=>{
                        if(err){
                            console.log(err);
                        }
                    })
                }
                
                ctx.session.BarCount[`${ctx.session.changeCode}`] += ctx.session.changeCount * 1
                ctx.session.BarCount['Всего'] += ctx.session.changeCount * 1
                ctx.reply('Изменено')
            }else{
                ctx.reply('Неверный формат записи')
            }
          
        }
    })
}
function formRes(ctx, obj) {
    let count = 0
    ctx.session.res = ''
    for(let value of Object.keys(obj)){
        conn.query(`select * from items where item_barcode = '${value}'`, (err, res)=>{
            if(err){console.log(err)}else{
                if(res[0]){
                    if(obj[value] != 0 && value != 'Всего' && !ctx.session.res.includes(`${res[0][`item_name`]}`)){
                        count += 1
                        ctx.session.res += `${count}. ${res[0][`item_name`]} - ${obj[value] * res[0]['item_count']} шт.\n`
                    }
                }
            }
        })
    }
}
function sendRes(id, ctx){
    let count = 0
    ctx.session.res = ''
    for(let value of Object.keys(ctx.session.Final)){
        conn.query(`select * from items where item_barcode = '${value}'`, (err, res)=>{
            if(err){console.log(err)}else{
                if(res[0]){
                    if(ctx.session.Final[value] != 0 && !ctx.session.res.includes(`${res[0][`item_name`]}`)){
                        count += 1
                        ctx.session.res += `${count}. ${res[0][`item_name`]} - ${ctx.session.Final[value] * res[0]['item_count']} шт.\n`
                        if(count === helper.getLength(ctx.session.Final)){
                            ctx.reply(`Результат приёмки №${id}:\n${ctx.session.res}`)
                        }
                    }

                }
            }
        })
    }
}

//=============================SCENES========================================

//Удалить пользователя
function DelUserScene(){
    const DELuser = new BaseScene('DELuser')
    DELuser.enter(async(ctx) => {
        await ctx.reply('Напишите ФИО пользователя, которого хотите удалить.', Markup.keyboard(kb.back))
    })
    DELuser.on('text', async(ctx) => {
        if(ctx.message.text !== kbBtns.back.back){
            const chatId = ctx.update.message.chat['id']
            const name = ctx.message.text
            conn.query(`DELETE FROM users WHERE user_name = '${name}' and user_role <> 'Admin'`, (err, DELresults)=>{
                if(err){
                    console.log(err);
                }else{
                    if(DELresults['affectedRows'] !== 0){
                        ctx.telegram.sendMessage(chatId, `Пользователь удалён`)
                        ctx.scene.leave()
                        AdminFunctional(ctx)
                    }else{
                        ctx.telegram.sendMessage(chatId, `Данного пользователя нет в базе или он является администратором`)
                        ctx.scene.leave()
                        AdminFunctional(ctx)
                    }
                }
            })
        }else{
            ctx.scene.leave()
            AdminFunctional(ctx)
        }    
    })
    return DELuser
}

//Удалить товар
function DelItemScene() {
    const delItem = new BaseScene('delItem')
    delItem.enter(async(ctx) => {
        await ctx.reply('Напишите штрихкод предмета, который хотите удалить.', Markup.keyboard(kb.back))
    })
    delItem.on('text', async(ctx) => {
        if(ctx.message.text !== kbBtns.back.back){
            const chatId = ctx.update.message.chat['id']
            const barcode = ctx.message.text
            conn.query(`DELETE FROM priemka_data WHERE Scanned_barcode = '${barcode}'`, (err, results)=> {
                if(err){
                    console.log(err);
                }
            }) 
            conn.query(`DELETE FROM items WHERE item_barcode = '${barcode}'`, (err, DELresults)=>{
            if(err){
                console.log(err);
            }else{
                if(DELresults['affectedRows'] !== 0){
                    ctx.telegram.sendMessage(chatId, `Предмет удалён`)
                    ctx.scene.leave()
                    AdminFunctional(ctx)
                }else{
                    ctx.telegram.sendMessage(chatId, `Данного предмета нет в базе`)
                    ctx.scene.leave()
                    AdminFunctional(ctx)
                }
            }
            })
        }else{
            AdminFunctional(ctx)
        }
        ctx.scene.leave()
    })
    return delItem
}

//Добавление нового пользователя
function requestUserIDScene() {
    const requestUserID = new BaseScene('requestUserID')
    requestUserID.enter(ctx => ctx.reply('Введите User ID нового пользователя', Markup.keyboard(kb.back)))
    requestUserID.on('text', ctx => {
        if(ctx.message.text != kbBtns.back.back){
            ctx.session.UserID = ctx.message.text
            ctx.scene.enter('requestUserName')
        }else{
            AdminFunctional(ctx)
            ctx.scene.leave()
        }       
    })
    return requestUserID
}
function requestUserNameScene() {
    const requestUserName = new BaseScene('requestUserName')
    requestUserName.enter(ctx => ctx.reply('Теперь введите ФИО нового пользователя', Markup.keyboard(kb.back)))
    requestUserName.on('text', ctx => {
        if(ctx.message.text != kbBtns.back.back){
            ctx.session.Username = ctx.message.text
            ctx.scene.enter('requestUserRole')
        }else{
            AdminFunctional(ctx)
            ctx.scene.leave()
        } 
        
    })
    return requestUserName
}
function requestUserRoleScene() {
    const requestUserRole = new BaseScene('requestUserRole')
    requestUserRole.enter(ctx => ctx.reply('Введите роль нового пользователя: Администартор или Приёмщик', Markup.keyboard(kb.back)))
    requestUserRole.on('text', ctx => {
        if(ctx.message.text != kbBtns.back.back){
            let role
            if(ctx.message.text.toLowerCase() === 'администратор'){
                role = 'Admin'
                ctx.session.sRole = ctx.message.text
                ctx.session.Role = role
                ctx.scene.enter('requestUserChatID')
            }else if(ctx.message.text.toLowerCase() === 'приемщик' || ctx.message.text.toLowerCase() === 'приёмщик'){
                role = 'Receiver'
                ctx.session.sRole = ctx.message.text
                ctx.session.Role = role
                ctx.scene.enter('requestUserChatID')
            }else{
                ctx.reply('Неверный формат роли, пользователь может быть либо администратором, либо приёмщиком')
                AdminFunctional(ctx)
                ctx.scene.leave()
            }
            
        }else{
            AdminFunctional(ctx)
            ctx.scene.leave()
        }
    })
    return requestUserRole
}
function requestUserChatIDScene() {
    const requestUserChatID = new BaseScene('requestUserChatID')
    requestUserChatID.enter(ctx => ctx.reply('Введите СhatID нового пользователя', Markup.keyboard(kb.back)))
    requestUserChatID.on('text', ctx => {
        if(ctx.message.text != kbBtns.back.back){
            ctx.session.UserChatID = ctx.message.text
            ctx.reply(`
            Проверте корректность введённых данных:\n
            UserID: ${ctx.session.UserID} \n
            ФИО: ${ctx.session.Username} \n
            Роль: ${ctx.session.sRole}\n
            ChatID: ${ctx.session.UserChatID}`, Markup.keyboard(kb.apply))
            ctx.scene.enter('AddUser')
        }else{
            AdminFunctional(ctx)
            ctx.scene.leave()
        }
    })
    return requestUserChatID
}
function AddUserScene() {
    const AddUser = new BaseScene('AddUser')
    AddUser.on('text', ctx=>{
        if(ctx.message.text === kbBtns.apply.apply){
            conn.query(`insert into users values('${ctx.session.UserID}', '${ctx.session.Username}', '${ctx.session.Role}', '${ctx.session.UserChatID}')`, (err, ADDres)=>{
                if(err){
                    console.log(err);
                    ctx.reply('Ошибка базы данных')
                    AdminFunctional(ctx)
                    ctx.scene.leave()
                }else{
                    ctx.reply('Пользователь добавлен')
                    AdminFunctional(ctx)
                    ctx.scene.leave()
                }
            })
        }else{
            AdminFunctional(ctx)
            ctx.scene.leave()
        }
    }) 
    return AddUser
}

//Результат приёмки или инвентаризации
function requestMonthScene() {
    const requestMonth = new BaseScene('requestMonth')
    requestMonth.enter(ctx => {
        const type = ctx.session.type
        let rep
        type == 'priemka'? rep = 'приёмки': rep = 'инвентаризации'
        ctx.reply(`Введите месяц ${rep}, результат которой хотите узнать`, Markup.keyboard(kb.months))
    })
    requestMonth.on('text', ctx=>{ 
        if(ctx.message.text != kbBtns.back.back){
            ctx.session.month = ctx.message.text.toLowerCase()
            ctx.scene.enter('requestYear')
        }else{
            ctx.scene.leave()
            AdminFunctional(ctx)
        }
    })
    return requestMonth
}
function requestYearScene() {
    const requestYear = new BaseScene('requestYear')
    requestYear.enter(ctx=> ctx.reply('Теперь введите год', Markup.keyboard(kb.back)))
    requestYear.on('text', ctx=>{
        const type = ctx.session.type
        let upperType
        type == 'priemka'? upperType = 'Priemka': upperType = 'invent'
        ctx.session.year = ctx.message.text
        if(ctx.message.text != kbBtns.back.back){
            ctx.session.res = ''
            conn.query(`select * from ${type}`, (err, IDResult)=>{
                if(err){
                    console.log(err);
                }else{
                    let count = 0
                    let priems = ''
                    for(let value of IDResult){ 
                        if(value[`${upperType}_date`].split('.')[1] + '.' + value[`${upperType}_date`].split('.')[2] == Months[`${ctx.session.month}`]  + '.' + ctx.session.year){
                            count += 1
                            const id = value[`${type}_id`]
                            const date = value[`${upperType}_date`]
                            const receiver = value[`${upperType}_reciever`]
                            let rep
                            type == 'priemka'? rep = 'Приёмка': rep = 'Инвентаризация'
                            priems += `${count}. ${rep} № ${id} от ${date}. Принимал - ${receiver} \n`
                        }
                    }
                    ctx.reply(priems)
                }
            })
        }
        ctx.scene.leave()
        AdminFunctional(ctx)
    })
    return requestYear
}

//результат конкретной приёмки
function requestPriemIDscene(){
    const requestPriem = new BaseScene('requestPriem')
    requestPriem.enter(ctx=>{
        const type = ctx.session.type
        let rep
        type == 'priemka'? rep = 'приёмки': rep = 'инвентаризации' 
        ctx.reply(`Введите № ${rep}, данные которой хотите узнать`, Markup.keyboard(kb.back))
    })
    requestPriem.on('text', ctx=>{
        const type = ctx.session.type
        let upperType
        type == 'priemka'? upperType = 'Priemka': upperType = 'invent'
        let query = ''
        type == 'priemka'?query = 'Scanned_barcode': query = 'invent_barcode'
        if(ctx.message.text != kbBtns.back.back){
            const id = ctx.message.text
            const resObj = {}
            conn.query(`select * from ${type}_data where ${upperType}_id = ${id}`, (err, res)=>{
            if(err){
                console.log(err);
            }else{
                for(let values of res){
                    resObj[`${values[`${query}`]}`] = 0
                }
                for(let values of res){
                    resObj[`${values[`${query}`]}`] += 1
                }
                let count = 0
                let rep
                type == 'priemka'? rep = 'приёмки': rep = 'инвентаризации' 
                var specRes = `Результат ${rep} №${id}:\n`
                for(let value of Object.keys(resObj)){
                    conn.query(`select * from items where item_barcode = '${value}'`, (err, res)=>{
                        if(err){console.log(err)}else{
                            if(res[0]){
                                if(resObj[value] != 0 && value != 'Всего' && !res.includes(`${res[0][`item_name`]}`)){
                                    count += 1
                                    specRes += `${count}. ${res[0][`item_name`]} - ${resObj[value] * res[0]['item_count']} шт.\n`
                                    if(count == helper.getLength(resObj)){
                                        ctx.reply(specRes)
                                    }
                                }
                            }
                        }
                    })
                }
                
            }
        })
        }
        ctx.scene.leave()
        AdminFunctional(ctx)
    }) 
    return requestPriem
}

//удалить приёмку
function deletePriemScene() {
    const deletePriem = new BaseScene(`deletePriem`)
    deletePriem.enter(ctx => {
        let rep
        ctx.session.type == 'priemka'? rep = 'приёмки' : rep = 'инвентаризации'
        ctx.reply(`Введите № ${rep}, которую хотите удалить`, Markup.keyboard(kb.back))
    })
    deletePriem.on('text', ctx=>{
        if(ctx.message.text !== kbBtns.back.back){
            ctx.session.delID = ctx.message.text
            ctx.scene.enter(`confirmDelete`)
        }else{
            AdminFunctional(ctx)
            ctx.scene.leave()
        }
        
    })
    return deletePriem
}
function confirmDeleteScene(){
    const confirmDelete = new BaseScene(`confirmDelete`)
    confirmDelete.enter(ctx=>{
            let rep
            ctx.session.type == 'priemka'? rep = 'Приёмка' : rep = 'Инвентаризация'
            ctx.reply(`${rep} №${ctx.session.delID} будет удалена, вы уверены?`, Markup.keyboard(kb.apply))
        })
    confirmDelete.on('text', ctx=>{
        let type = ctx.session.type
        if(ctx.message.text === kbBtns.apply.apply){
            conn.query(`delete from ${type}_data where ${type}_id = ${ctx.session.delID}`, (err, res)=>{
                if(err){
                    console.log(err);
                }
            })
            conn.query(`delete from ${type} where ${type}_id = ${ctx.session.delID}`, (err, res)=>{
                if(err){
                    console.log(err);
                }else{
                    ctx.reply('Удаление из базы данных прошло успешно');
                }
            })
        }
        AdminFunctional(ctx)
        ctx.scene.leave()
    })
    return confirmDelete
}

//добавить новый товар
function nameScene(status) {
    const nameScene = new BaseScene(`nameScene(${status})`)
    nameScene.enter(async(ctx) => {await ctx.reply('Назание товара:', Markup.keyboard(kb.back))})
    nameScene.on('text', async(ctx) => {
        var keyboard
        ctx.session.type == 'priemka'? keyboard = kb.priemka: keyboard = kb.invent 
        if(ctx.message.text !== kbBtns.back.back){
            ctx.session.name = ctx.message.text
            ctx.scene.enter(`countScene(${status})`)
        }else{
            if(ctx.session.isStarted){
                ctx.reply('Возврат к приёму штрихкодов', Markup.keyboard(keyboard))
                PriemkaFunctional(ctx)                
            }else{
                AdminFunctional(ctx)
            }
            ctx.scene.leave()
        }
    })
    return nameScene
}
function countScene(status) {
    const countScene = new BaseScene(`countScene(${status})`)
    countScene.enter(ctx => ctx.reply('Кол-во в одной упаковке:', Markup.keyboard(kb.back)))
    countScene.on('text', ctx => {
        var keyboard
        ctx.session.type == 'priemka'? keyboard = kb.priemka: keyboard = kb.invent 
        if(ctx.message.text !== kbBtns.back.back){
            ctx.session.count = ctx.message.text
            ctx.scene.enter(`codeScene(${status})`)
        }else{
            if(ctx.session.isStarted){
                ctx.reply('Возврат к приёму штрихкодов', Markup.keyboard(keyboard))
                setTimeout(()=>{
                    PriemkaFunctional(ctx)
                }, 10)
                ctx.scene.leave()
            }else{
                setTimeout(()=>{
                    AdminFunctional(ctx)
                }, 10)
                ctx.scene.leave()
            }
        }
        
    })
    return countScene
}
function codeScene(status) {
    const codeScene = new BaseScene(`codeScene(${status})`)
    codeScene.enter(ctx => ctx.reply('Штрихкод:', Markup.keyboard(kb.back)))
    codeScene.on('text', ctx => {
    var keyboard
    ctx.session.type == 'priemka'? keyboard = kb.priemka: keyboard = kb.invent         
    if(ctx.message.text !== kbBtns.back.back){
            ctx.session.barcode = ctx.message.text
            if(ctx.session.barcode.length === 13 && helper.isNumeric(ctx.session.barcode)){
                ctx.reply(`
                Проверте корректность введённых данных:\n
                Название: ${ctx.session.name} \n
                Количество: ${ctx.session.count} \n
                Штрихкод: ${ctx.session.barcode}`, Markup.keyboard(kb.apply)
                )
                ctx.scene.enter(`addScene(${status})`)
            }else{
                ctx.reply('Неверный формат штрихкода', Markup.keyboard(keyboard))
                if(ctx.session.isStarted){
                    ctx.reply('Возврат к приёму штрихкодов', Markup.keyboard(keyboard))
                    setTimeout(()=>{
                        PriemkaFunctional(ctx)
                    }, 10)
                    ctx.scene.leave()
                }else{
                    setTimeout(()=>{
                        AdminFunctional(ctx)
                    }, 10)
                    ctx.scene.leave()
                }
            }
            
        }else{
            if(ctx.session.isStarted){
                ctx.reply('Возврат к приёму штрихкодов', Markup.keyboard(keyboard))
                setTimeout(()=>{
                    PriemkaFunctional(ctx)
                }, 10)
                ctx.scene.leave()
            }else{
                setTimeout(()=>{
                    AdminFunctional(ctx)
                }, 10)
                ctx.scene.leave()
            }
        }
    })
    return codeScene
}
function addScene(status) {
    const addScene = new BaseScene(`addScene(${status})`)
    addScene.enter(ctx => ctx.reply('---'))
    addScene.on('text', ctx => {
        var keyboard
        ctx.session.type == 'priemka'? keyboard = kb.priemka: keyboard = kb.invent 
        if(ctx.message.text !== kbBtns.back.back){
            if(!ctx.session.BarCount){
                ctx.session.BarCount = {}
            }
            conn.query(`INSERT INTO items VALUES('${ctx.session.name}', ${ctx.session.count}, '${ctx.session.barcode}')`, (err, INSresult)=> {
                {
                    if(err){
                        console.log(err);
                        ctx.reply('Ошибка базы данных, проверте корректность данных', Markup.keyboard(kb.priemka))
                        if(ctx.session.isStarted){
                            ctx.reply('Возврат к приёму штрихкодов', Markup.keyboard(keyboard))
                            ctx.scene.enter(`startScene(${ctx.session.status},${ctx.session.type})`)
                        }else{
                            AdminFunctional(ctx)
                            ctx.scene.leave()
                        }
                    }else{
                        ctx.reply('Товар добавлен')
                        ctx.session.BarCount[`${ctx.session.barcode}`] = 0
                        if(ctx.session.isStarted){
                            ctx.reply('Возврат к приёму штрихкодов', Markup.keyboard(keyboard))
                            ctx.scene.enter(`startScene(${ctx.session.status},${ctx.session.type})`)
                        }else{
                            AdminFunctional(ctx)
                            ctx.scene.leave()
                        }
                        
                    }
                }
            })
        }else{
            if(ctx.session.isStarted){
                ctx.reply('Возврат к приёму штрихкодов', Markup.keyboard(keyboard))
                setTimeout(()=>{
                    PriemkaFunctional(ctx)
                }, 10)
                ctx.scene.enter(`startScene(${ctx.session.status},${ctx.session.type})`)
            }else{
                setTimeout(()=>{
                    AdminFunctional(ctx)
                }, 10)
                ctx.scene.leave()
            }
        }
    })
    return addScene
}

//Старт приёмки или инвентаризации
function startScene(status, functional, type) {
    const startScene = new BaseScene(`startScene(${status},${type})`)
    startScene.enter(ctx => setTimeout(()=>{
        ctx.session.type = type
        ctx.session.res = ''
        ctx.session.status = status
        formRes(ctx, ctx.session.BarCount)       
    }, 40))
    startScene.on('text', ctx => {
        if(helper.isNumeric(ctx.message.text) || ctx.message.text.includes(`\n`)){
            const codes = helper.splitter(ctx.message.text)
            for(let code of Object.keys(codes)){
                if(code.length == 13){
                    for(let j = 0; j < codes[`${code}`]; j++){
                        conn.query(`insert into ${type}_data values(${ctx.session.id}, '${code}')`, (err, STARTresult)=>{
                            if(err){
                                console.log(err)
                                ctx.reply(`Штрихкода ${code} нет в базе, вы можете добавить его в базу нажав на "Добавить товар"`)  
                            }else{
                                ctx.session.BarCount['Всего'] += 1
                                ctx.session.BarCount[`${code}`] += 1
                            }
                        })
                    }
                }else{
                    ctx.reply(`Штрихкод ${code} не удовлетворяет стандартам, скорее всего сканер сработал криво, попробуйте отсканировать штрихкод ещё раз`)
                } 
            }
            ctx.scene.reenter()
        }else{
            if(type == 'priemka'){
                switch(ctx.message.text){
                    case kbBtns.priemka.end:
                        isStarted = false
                        ctx.reply('Приёмка завершена')
                        conn.query(`update ${type} set ${type}_status = 'Completed' where ${type}_status = 'Active'`, (err, result) => {
                            if(err){
                                console.log(err);
                            }
                        })
                        conn.query(`select user_id from users where user_role = 'Admin'`, (err, results)=>{
                            if(err){
                                console.log(err);
                            }else{
                                for(let result of results){
                                    if(result !== ctx.session.AdminID){
                                        ctx.telegram.sendMessage(result['user_id'], `Приёмка №${ctx.session.id} завершена.\nРезультат:\n${ctx.session.res}`)
                                    }
                                }
                            }
                        })
                        functional(ctx)
                        ctx.scene.leave()
                        break
                    case kbBtns.priemka.res:
                        ctx.scene.enter(`PriemRes(${status},${type})`)
                        ctx.scene.reenter()
                        break
                    case kbBtns.priemka.addItem:
                        ctx.scene.enter(`nameScene(${status})`)
                        break
                    case kbBtns.priemka.changeCount:
                        ctx.scene.enter('barChangeScene')
                        break
                    default:
                        ctx.reply(`Функционал приёмки:`, Markup.keyboard(kb.priemka))
                        ctx.scene.reenter()
                        break
                }
            }else{
                switch(ctx.message.text){
                    case kbBtns.invent.end:
                        isStarted = false
                        ctx.reply('Инвентаризация завершена')
                        conn.query(`update ${type} set ${type}_status = 'Completed' where ${type}_status = 'Active'`, (err, result) => {
                            if(err){
                                console.log(err);
                            }
                        })
                        conn.query(`select user_id from users where user_role = 'Admin'`, (err, results)=>{
                            if(err){
                                console.log(err);
                            }else{
                                for(let result of results){
                                    if(result !== ctx.session.AdminID){
                                        ctx.telegram.sendMessage(result['user_id'], `Инвентаризация №${ctx.session.id} завершена.\nРезультат:\n${ctx.session.res}`)
                                    }
                                }
                            }
                        })
                        functional(ctx)
                        ctx.scene.leave()
                        break
                    case kbBtns.invent.res:
                        ctx.scene.enter(`PriemRes(${status},${type})`)
                        ctx.scene.reenter()
                        break
                    case kbBtns.invent.addItem:
                        ctx.scene.enter(`nameScene(${status})`)
                        break
                    case kbBtns.invent.changeCount:
                        ctx.scene.enter('barChangeScene')
                        break
                    default:
                        ctx.reply(`Функционал инвентаризации:`, Markup.keyboard(kb.invent))
                        ctx.scene.reenter()
                        break
                }
            }
        }
        
    })
    return startScene
}

//Изменить кол-во ШК
function barChangeScene(status) {
    const barChange = new BaseScene('barChangeScene') 
    barChange.enter(ctx => setTimeout(()=>{ctx.reply('Введите штрихкод, количество которого хотите изменить', Markup.keyboard(kb.back))}, 10))
    barChange.on('text', ctx=> {
        var keyboard
        ctx.session.type == 'priemka'? keyboard = kb.priemka: keyboard = kb.invent 
        if(ctx.message.text != kbBtns.back.back){
            ctx.session.changeCode = ctx.message.text
            ctx.scene.enter('operator')
        }else{
            ctx.reply('Возврат к приёму штрихкодов', Markup.keyboard(keyboard))
            ctx.scene.enter(`startScene(${ctx.session.status},${ctx.session.type})`)
        }
    })
    return barChange
}
function operatorScene() {
    const operator = new BaseScene('operator')
    operator.enter(ctx=> ctx.reply('Введите действие, + или -', Markup.keyboard(kb.back)))
    operator.on('text', ctx=>{
        var keyboard
        ctx.session.type == 'priemka'? keyboard = kb.priemka: keyboard = kb.invent 
        if(ctx.message.text != kbBtns.back.back){
            ctx.session.operator = ctx.message.text
            ctx.scene.enter('howMuchCodes')
        }else{
            ctx.reply('Возврат к приёму штрихкодов', Markup.keyboard(keyboard))
            ctx.scene.enter(`startScene(${ctx.session.status},${ctx.session.type})`)
        }
    })
    return operator
}
function howMuchCodesScene(){
    const howMuchCodes = new BaseScene('howMuchCodes') 
    howMuchCodes.enter(ctx => setTimeout(()=>{ctx.reply('Теперь укажите на сколько изменить', Markup.keyboard(kb.back))}, 10))
    howMuchCodes.on('text', ctx=> {
        var keyboard
        ctx.session.type == 'priemka'? keyboard = kb.priemka: keyboard = kb.invent 
        if(ctx.message.text != kbBtns.back.back){
            ctx.session.changeCount = ctx.message.text
            barChanger(conn, ctx)
            ctx.scene.enter(`startScene(${ctx.session.status},${ctx.session.type})`)
        }else{
            ctx.reply('Возврат к приёму штрихкодов', Markup.keyboard(keyboard))
            ctx.scene.enter(`startScene(${ctx.session.status},${ctx.session.type})`)
        }
    })

    return howMuchCodes
}

//результат текущей приёмки
function PriemResScene(status, type) {
    const PriemRes = new BaseScene(`PriemRes(${status},${type})`)
    PriemRes.enter(ctx => {
        conn.query(`select Max(${type}_id) from ${type}`, (err, res)=>{
            if(err){
                console.log(err);
            }else{
                const id = res[0][`Max(${type}_id)`]
                const resObj = {}
                conn.query(`select * from ${type}_data where ${type}_id = ${id}`, (err, res)=>{
                    if(err){
                        console.log(err);
                    }else{
                        let query = ''
                        type == 'priemka'?query = 'Scanned_barcode': query = 'invent_barcode'
                        for(let values of res){
                            //
                            resObj[`${values[`${query}`]}`] = 0
                        }
                        for(let values of res){
                            resObj[`${values[`${query}`]}`] += 1
                        }
                        let count = 0
                        var specRes = ''
                        type == 'priemka'?specRes = `Результат приёмки:\n`: specRes = `Результат инвентаризации:\n`
                        for(let value of Object.keys(resObj)){
                            conn.query(`select * from items where item_barcode = '${value}'`, (err, res)=>{
                                if(err){
                                    console.log(err)
                                }else{
                                    if(res[0]){
                                        if(resObj[value] != 0 && value != 'Всего' && !res.includes(`${res[0][`item_name`]}`)){
                                            count += 1
                                            specRes += `${count}. ${res[0][`item_name`]} - ${resObj[value] * res[0]['item_count']} шт.\n`
                                            if(count == helper.getLength(resObj)){
                                                ctx.reply(specRes)
                                            }
                                        }
                                    }
                                }
                            })
                        }
                    }
                })
            }
        })
        ctx.scene.enter(`startScene(${status},${type})`)
    })
    return PriemRes
}

//===================
const Months = {
    январь: 1,
    февраль: 2,
    март: 3,
    апрель: 4,
    май: 5,
    июнь: 6,
    июль: 7,
    август: 8,
    сентябрь: 9,
    октябрь: 10,
    ноябрь: 11,
    декабрь: 12
}