
# LocalDB
Uses NodeJS FileSystem to manage and store data locally on the system. It is an extremely fast and reliable database. No network requests are made and everything is held locally. Each table will have buckets which can hold up to 500 documents 



## API Reference

#### Render HTML as PNG/JPEG

```js
    const bigdb = require("/path/to/interact.js");
```

| Parameter | Type     | Description                | Usage |
| :-------- | :------- | :------------------------- | :--------- |
| `createTable` | `function` | Creates a table by passing in a string | db.createTable("table_name") |
| `deleteTable` | `function` | Deletes a table by passing in a string | db.deleteTable("table_name") |
| `insertOne` | `function` | Writes json to a table | db.insertOne({ field: value }, "table_name") |
| `findOne` | `function` | Reads from a table / **Setting true as the third function parameter means it will only return the first result** | db.findOne({ username: 'person 1' }, "table_name"); |
| `deleteOne` | `function` | Deletes most relevant result from database **This will only delete one document at a time** | db.delete({ username: 'person 1' }, "table_name"); |
| `updateOne` | `function` | Updates most relevant result from database **This will only update one document at a time** | db.update({ getUser: '123' }, { setUsername: 'user123' }, "table_name"); |





## Features

- Reliable
- Synchronous
- Uses Built In Filesystem
- Supports huge amounts of data (up to 1gb of returned data)

