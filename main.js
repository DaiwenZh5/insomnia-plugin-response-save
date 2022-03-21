// For help writing plugins, visit the documentation to get started:
//   https://docs.insomnia.rest/insomnia/introduction-to-plugins

const fs = require('fs');

/**
 * 从 header 中读取文件名
 * @param {Array} headers
 */
function getFileName(headers) {
    const fileName = headers.find(header => header.name === 'Content-Disposition')
        ?.value
        ?.replace(/(UTF-8)|(attachment;)|(filename[\*]=)|'/ig, '')
        || `导出-${new Date().getTime()}.bin`;
    console.log(fileName);
    return decodeURI(fileName);
}
module.exports.requestActions = [
    {
        label: 'Save/保存',
        action: async ({ app, network }, {request}) => {
            // 发送请求
            const response = await network.sendRequest(request);
            const { statusCode, statusMessage, bodyPath, headers, contentType } = response;
            if (statusCode !== 200) {
                await app.alert('导出失败', statusMessage);
                return;
            }
            // 判断是否为文件流
            if (contentType !== 'application/octet-stream') {
                const result = fs.readFileSync(bodyPath).toString();
                console.log(JSON.stringify(JSON.parse(result), null, '\t'));
                const body = document.createElement('div');
                body.innerHTML = '<pre style="padding: 2rem">' + JSON.stringify(JSON.parse(result), null, '\t\t') + '</pre>';
                await app.dialog('导出失败', body);
                return;
            }
            const fileName = getFileName(headers);
            const filePath = await app.showSaveDialog({
                defaultPath: fileName,
            });
            console.log("filePath: %o", filePath);
            // 当取消保存时退出
            if (!filePath) {
                console.log('导出已取消');
                return;
            }
            try {
                fs.copyFileSync(bodyPath, filePath);
                console.log('导出成功');
            } catch (error) {
                console.error('导出失败.', error);
            }
        },
        icon: 'fa-floppy-o',
    },
];