const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const staticUsagePath = "./db";

exports.createTable = (table) => {
    const keyTableName = uuidv4();
    const filePath = `${staticUsagePath}/data/${table}/${keyTableName}.json`;

    const checkTable = fs.existsSync(`${staticUsagePath}/data/${table}/`);
    if (checkTable) throw `Table '${table}' already exists`;

    const databaseHandler = require("./db.json");
    databaseHandler[table] = {
        currentFile: keyTableName,
        currentFileEntries: 0,
        allFiles: [keyTableName]
    }

    if (!fs.existsSync(`${staticUsagePath}/data/${table}/`)) fs.mkdirSync(`${staticUsagePath}/data/${table}/`);

    fs.writeFileSync(`${staticUsagePath}/db.json`, JSON.stringify(databaseHandler));
    fs.writeFileSync(filePath, JSON.stringify([]));
}

exports.deleteTable = (table) => {
    const dbTable = fs.readFileSync(`${staticUsagePath}/db.json`);
    if (!dbTable[table]) throw `Table ${table} does not exist.`;

    const filePath = `${staticUsagePath}/data/${table}/`;
    const checkPath = fs.existsSync(filePath);
    if (!checkPath) throw `Table ${table} does not exist.`;

    delete dbTable[table];
    fs.unlinkSync(filePath);

    fs.writeFileSync(`${staticUsagePath}/db.json`, JSON.stringify(dbTable));
}   

exports.insertOne = (json, table, options) => {
    const dbManager = require("./db.json");
    if (!dbManager[table]) throw `Table '${table}' does not exist`;
    
    let { currentFile, allFiles, currentFileEntries } = dbManager[table];
    if (currentFileEntries >= 5000) {
        const keyTableName = uuidv4();
        dbManager[table].currentFile = keyTableName;
        dbManager[table]["allFiles"] = [keyTableName, ...dbManager[table]["allFiles"]];
        dbManager[table]["currentFileEntries"] = 0;

        fs.writeFileSync(`${staticUsagePath}/db.json`, JSON.stringify(dbManager));
        fs.writeFileSync(`${staticUsagePath}/data/${table}/${keyTableName}.json`, JSON.stringify([]));
       
        currentFile = keyTableName;
        allFiles = dbManager[table]["allFiles"];
        currentFileEntries = dbManager[table]["currentFileEntries"];
    }

    const filePath = `${staticUsagePath}/data/${table}/${currentFile}.json`;
    const checkTable = fs.existsSync(filePath);
    if (!checkTable) throw `Table '${table}' has no bucket '${currentFile}' does not exist`;

    const customId = options?.["maintainId"] || uuidv4();
    json._id = customId;

    const currentData = [...JSON.parse(fs.readFileSync(filePath)), json];
    fs.writeFileSync(filePath, JSON.stringify(currentData));

    dbManager[table]["currentFileEntries"] = currentData.length;
    fs.writeFileSync(`${staticUsagePath}/db.json`, JSON.stringify(dbManager));
};

exports.findOne = (fields, table) => {
    const dbManager = require("./db.json");
    if (!dbManager[table]) throw `Table '${table}' does not exist`;

    let { allFiles } = dbManager[table];
    const returned = new Array();

    for (const setFile of allFiles) {
        const filePath = `${staticUsagePath}/data/${table}/${setFile}.json`;
        const checkTable = fs.existsSync(filePath);
        if (!checkTable) return { error: `table '${table}' does not exist` };
    
        const documents = JSON.parse(fs.readFileSync(filePath));
    
        for (const document of documents) {
            let matched = 0;
            const keys = Object.keys(fields);
    
            for (const key of keys) {
                const value = fields[key];
    
                if (document[key] === value) matched++;
            }
    
            if (matched == keys.length) returned.push(document);
        }
    }

    return returned[0];
};

exports.query = (fields, table) => {
    const dbManager = require("./db.json");
    if (!dbManager[table]) throw `Table '${table}' does not exist`;

    let { allFiles } = dbManager[table];
    const returned = new Array();

    for (const setFile of allFiles) {
        const filePath = `${staticUsagePath}/data/${table}/${setFile}.json`;
        const checkTable = fs.existsSync(filePath);
        if (!checkTable) throw `Table '${table}' does not exist`;
    
        const documents = JSON.parse(fs.readFileSync(filePath));
    
        for (const document of documents) {
            let matched = 0;
            const keys = Object.keys(fields);
    
            for (const key of keys) {
                const value = fields[key];
    
                if (document[key] === value) matched++;
            }
    
            if (matched == keys.length) returned.push(document);
        }
    }

    return returned || [];
};

exports.queryLimit = (fields, limit, table) => {
    const dbManager = require("./db.json");
    if (!dbManager[table]) throw `Table '${table}' does not exist`;

    let { allFiles } = dbManager[table];
    const returned = new Array();

    for (const setFile of allFiles) {
        if (returned.length >= (limit || 100)) continue;

        const filePath = `${staticUsagePath}/data/${table}/${setFile}.json`;
        const checkTable = fs.existsSync(filePath);
        if (!checkTable) throw `Table '${table}' does not exist`;
    
        const documents = JSON.parse(fs.readFileSync(filePath));
        for (const document of documents) {
            let matched = 0;
            const keys = Object.keys(fields);
    
            for (const key of keys) {
                const value = fields[key];
    
                if (document[key] === value) matched++;
            }
    
            if (matched == keys.length) returned.push(document);
        }
    }

    return returned || [];
};

exports.deleteOne = (fields, table) => {
    const dbManager = require("./db.json");

    if (!dbManager[table]) throw `Table '${table}' does not exist`;
    const { currentFile, currentFileEntries, allFiles } = dbManager[table];

    const filePath = `${staticUsagePath}/data/${table}/${currentFile}.json`;
    let deleted = false;

    const checkTable = fs.existsSync(filePath);
    if (!checkTable) throw `Table '${table}' bucket '${currentFile}' does not exist`;
    
    for (const file of allFiles) {
        if (deleted) continue;
        const toDelete = new Array();

        const documents = require(`./data/${table}/${file}.json`);
        for (const document of documents) {
            if (deleted) continue;

            const keys = Object.keys(fields);
            let matched = 0;
    
            for (const key of keys) {
                const value = fields[key];
                if (document[key] === value) matched++;
            }
    
            if (matched == keys.length) {
                if (!deleted) deleted = true
                toDelete.push(document._id);
            }
        }

        
        const newData = documents.filter(document => toDelete.includes(document._id) ? null : document);

        if (newData.length < 1 && dbManager[table]["allFiles"].length-1 > 0) {
            dbManager[table]["allFiles"] = dbManager[table]["allFiles"].filter(entry => entry === file ? null : entry);
            dbManager[table]["currentFile"] = dbManager[table]["allFiles"][0];
            fs.unlinkSync(`${staticUsagePath}/data/${table}/${file}.json`);
            fs.writeFileSync(`${staticUsagePath}/db.json`, JSON.stringify(dbManager));
        } else {
            dbManager[table]["currentFileEntries"] = newData.length;
            fs.writeFileSync(`${staticUsagePath}/data/${table}/${file}.json`, JSON.stringify(newData));
            fs.writeFileSync(`${staticUsagePath}/db.json`, JSON.stringify(dbManager));
        }
    }

    
    if (deleted === true) return { deleted, rows: 1 }
    return { deleted, rows: 0 }
};

exports.updateOne = (getFields, update, table) => {
    let result = exports.findOne(getFields, true, table);
    if (result?.error || !result) return { updated: false, rows_affected: 0 };
    
    const keys = Object.keys(update["$set"]);
    for (const key of keys) {
        result[key] = update["$set"][key];
    }
    
    result["updatedDocumentMSStamp"] = new Date().getTime();
    exports.deleteOne({ _id: result._id }, null, table);
    exports.insertOne(result, null, table, { maintainId: result._id });

    return { updated: true, rows_affected: 1 };
};

module.exports;