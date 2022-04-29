const http = require('http');


http.get('http://localhost:8080/api/v1/commands/ping', async res => {
    const buffers = [];

    for await (const chunk of res) {
      buffers.push(chunk);
    }
  
    const data = Buffer.concat(buffers).toString();
  
    console.log(data);
});