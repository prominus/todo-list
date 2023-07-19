

/**
 * A single TODO in our list of Todos
 * @typedef {Object} ToDo
 * @property {string} id
 * @property {string} label
 * @property {boolean} isDone
 * @property {string} userId
 */
class ToDo {
    constructor(id, label, isDone, userId) {
        this.id = id;
        this.label = label;
        this.isDone = isDone;
        this.userId = userId
    }
}

class ToDoList {
    static ID = "todo-list";

    static FLAGS = {
        TODOS: 'todos'
    }

    static TEMPLATES = {
        TODOLIST : `modules/${this.ID}/templates/todo-list.hbs`
    }

    static log(force, ...args) {
        const shouldLog = force || game.modules.get('_dev_mode')?.api?.getPackageDebugDal

        if(shouldLog) {
            console.log(this.ID, '|', ...args);
        }
    }
}

class ToDoListData {
    // all todos for all users
    static get allToDos() {
        const allToDos = game.users.reduce((accumulator, user) => {
            const userTodos = this.getToDosForUser(user.id);
            const return_val = {
                ...accumulator,
                ...userTodos
            }
            ToDoList.log(true, "allToDos:", return_val);
            return return_val;
        }, {});
        return allToDos;
    }

    // get all todos for a given user
    static getToDosForUser(userId) {
        return game.users.get(userId)?.getFlag(ToDoList.ID, ToDoList.FLAGS.TODOS);
    }

    // create a new todo for a given user
    static createToDo(userId, toDoData) {
        // generate a random id for this new ToDo and populate the userId
        const newToDo = new ToDo(
            foundry.utils.randomID(16),
            toDoData,
            false,
            userId
        )

        // construct the update to insert the new ToDo
        const newToDos = {
            [newToDo.id]: newToDo
        }

        // update the database with the new ToDos
        return game.users.get(userId)?.setFlag(ToDoList.ID, ToDoList.FLAGS.TODOS, newToDos);
    }

    // update a specific todo by id with the provides updateData
    static updateToDo( todoId, updateData) {
        const relevantToDo = this.allToDos[todoId];

        // construct the update to send
        const update = {
            [todoId]: updateData
        }

        // update the database with the updated ToDo list
        return game.users.get(relevantToDo.userId)?.setFlag(ToDoList.ID, ToDoList.FLAGS.TODOS, update);
    }

    static updateUserToDos(userId, updateData) {
        return game.users.get(userId)?.setFlag(ToDoList.ID, ToDoList.FLAGS.TODOS, updateData);
    }

    // delete a specific todo by id
    static deleteToDo(todoId) {
        const relevantToDo = this.allToDos[todoId];

        // Foundry specific syntax required to delete a key from a persisted object in the database
        const keyDeletion = {
            [`-=${todoId}`]:null   
        }

        // update the database with the updated ToDo list
        return game.users.get(relevantToDo.userId)?.setFlag(ToDoList.ID, ToDoList.FLAGS.TODOS, keyDeletion);
    }
}

Hooks.once('devModeReady', ({registerPackageDebugFlag}) => {
    registerPackageDebugFlag(ToDoList.ID);
})

Hooks.once('ready', () => {
    ToDoList.log(true, `Logging from ${ToDoList.ID}`)
    ToDoList.log(true, "Game user id:", game.userId)
    ToDoListData.createToDo(game.userId, {label: 'Foo'});
    let x = ToDoListData.getToDosForUser(game.userId);
    ToDoList.log(true, "My todos:", x);
    const todoIds = Object.keys(x);
    ToDoList.log(true, "My todoid:", x);
    ToDoListData.updateToDo(todoIds[0], "{label: 'Bar'}");
    x = ToDoListData.getToDosForUser(game.userId);
    ToDoList.log(true, "My updated todos:", x);
    todoIds.forEach(id => {
        ToDoListData.deleteToDo(id);

    });
    x = ToDoListData.getToDosForUser(game.userId);
    ToDoList.log(true, "My deleted todos:", x)

})