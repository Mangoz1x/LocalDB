
# JSON BigDB
Uses NodeJS FileSystem to manage and store data locally on the system. It is an extremely fast and reliable database. No network requests are made and everything is held locally. Each table will have buckets which can hold up to 500 documents 



## API Reference

#### Render HTML as PNG/JPEG

```js
    const bigdb = require("/path/to/interact.js");
```

| Parameter | Type     | Description                | Usage |
| :-------- | :------- | :------------------------- | :--------- |
| `create` | `function` | Creates a table by passing in a string | bigdb.create("table_name") |
| `write` | `function` | Writes json to a table | bigdb.write({ field: value }, "table_name") |
| `read` | `function` | Reads from a table / **Setting true as the third function parameter means it will only return the first result** | bigdb.read({ username: 'person 1' }, "table_name");
| `delete` | `function` | Deletes most relevant result from database **This will only delete one document at a time** | bigdb.delete({ username: 'person 1' }, "table_name"); 





## Features

- Reliable
- Synchronous
- Uses Built In Filesystem
- Supports huge amounts of data (up to 1gb of returned data)

