const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

exports.write = (json, table, options) => {
    const dbManager = require("./dbmanager.json");
    if (!dbManager[table]) return { error: `table '${table}' does not exist` };
    
    let { currentFile, allFiles, currentFileEntries } = dbManager[table];
    if (currentFileEntries >= 500) {
        const keyTableName = uuidv4();
        dbManager[table].currentFile = keyTableName;
        dbManager[table]["allFiles"] = [keyTableName, ...dbManager[table]["allFiles"]];
        dbManager[table]["currentFileEntries"] = 0;

        fs.writeFileSync(`${__dirname}/dbmanager.json`, JSON.stringify(dbManager));
        fs.writeFileSync(`${__dirname}/data/${table}/${keyTableName}.json`, JSON.stringify([]));
       
        currentFile = keyTableName;
        allFiles = dbManager[table]["allFiles"];
        currentFileEntries = dbManager[table]["currentFileEntries"];
    }

    const filePath = `${__dirname}/data/${table}/${currentFile}.json`;
    const checkTable = fs.existsSync(filePath);
    if (!checkTable) return { error: `table '${table}' has no bucket '${currentFile}' does not exist` };

    const customId = options?.["maintainId"] || uuidv4();
    json._id = customId;

    const currentData = [...JSON.parse(fs.readFileSync(filePath)), json];
    fs.writeFileSync(filePath, JSON.stringify(currentData));

    dbManager[table]["currentFileEntries"] = currentData.length;
    fs.writeFileSync(`${__dirname}/dbmanager.json`, JSON.stringify(dbManager));
};

exports.create = (table) => {
    const keyTableName = uuidv4();
    const filePath = `${__dirname}/data/${table}/${keyTableName}.json`;

    const checkTable = fs.existsSync(`${__dirname}/data/${table}/`);
    if (checkTable) return { error: `table '${table}' already exists` };

    const databaseHandler = require("./dbmanager.json");
    databaseHandler[table] = {
        currentFile: keyTableName,
        currentFileEntries: 0,
        allFiles: [keyTableName]
    }

    if (!fs.existsSync(`${__dirname}/data/${table}/`)) fs.mkdirSync(`${__dirname}/data/${table}/`);

    fs.writeFileSync(`${__dirname}/dbmanager.json`, JSON.stringify(databaseHandler));
    fs.writeFileSync(filePath, JSON.stringify([]));
}

exports.read = (fields, table, one) => {
    const dbManager = require("./dbmanager.json");
    if (!dbManager[table]) return { error: `table '${table}' does not exist`};

    let { allFiles } = dbManager[table];
    const returned = new Array();

    for (const setFile of allFiles) {
        const filePath = `${__dirname}/data/${table}/${setFile}.json`;
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

    if (returned.length < 1) return undefined; 
    if (one === true) return returned[0];
    return returned;
};

exports.delete = (fields, table) => {
    const dbManager = require("./dbmanager.json");

    if (!dbManager[table]) return { error: `table '${table}' does not exist` };
    const { currentFile, currentFileEntries, allFiles } = dbManager[table];

    const filePath = `${__dirname}/data/${table}/${currentFile}.json`;
    let deleted = false;

    const checkTable = fs.existsSync(filePath);
    if (!checkTable) return { error: `table '${table}' bucket '${currentFile}' does not exist` };
    
    for (const file of allFiles) {
        if (deleted) continue;
        const toDelete = new Array();

        const documents = require(`${__dirname}/data/${table}/${file}.json`);
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
            fs.unlinkSync(`${__dirname}/data/${table}/${file}.json`);
            fs.writeFileSync(`${__dirname}/dbmanager.json`, JSON.stringify(dbManager));
        } else {
            dbManager[table]["currentFileEntries"] = newData.length;
            fs.writeFileSync(`${__dirname}/data/${table}/${file}.json`, JSON.stringify(newData));
            fs.writeFileSync(`${__dirname}/dbmanager.json`, JSON.stringify(dbManager));
        }
    }

    
    if (deleted === true) return { deleted, rows: 1 }
    return { deleted, rows: 0 }
};

exports.update = (getFields, update, table) => {
    let result = this.read(getFields, table, true);
    if (result?.error || !result) return { error: result?.error || "no results found" };
    
    const keys = Object.keys(update);
    for (const key of keys) {
        result[key] = update[key];
    }
    
    result["updatedDocumentMSStamp"] = new Date().getTime();
    this.delete({ _id: result._id }, table);
    this.write(result, table, { maintainId: result._id });
};

module.exports;