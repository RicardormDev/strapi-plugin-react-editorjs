const ogs = require('open-graph-scraper');
const { parseMultipartData } = require('strapi-utils');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { LocalFileData } = require('get-file-object-from-local-path');

module.exports = {

  link: async (ctx) => {
    return await new Promise((resolve) => {
      ogs(ctx.query, (error, results, response) => {
        resolve({
          success: 1,
          meta: {
            title: results.ogTitle,
            description: results.ogDescription,
            image: {
              url: results.ogImage.url,
            },
          },
        })
      })
    })
  },

  byFile: async (ctx) => {
    try {
      const { files } = parseMultipartData(ctx)

      const [uploadedFile] = await strapi.plugins.upload.services.upload.upload({
        data: {},
        files: Object.values(files)
      })

      ctx.send({
        success: 1,
        file: uploadedFile
      })
    } catch (e) {
      ctx.send({
        success: 0,
        message: e.message
      }, 500)
    }
  },

  byURL: async (ctx) => {
    try {
      const { url } = ctx.request.body;
      const {name, ext} = path.parse(url)
      const filePath = `./public/${name}${ext}`

      const response = await axios.get(url, {responseType: 'arraybuffer'})
      const buffer = Buffer.from(response.data, 'binary')

      await fs.promises.writeFile(filePath, buffer)

      const fileData = new LocalFileData(filePath)

      const file = {
        path: filePath,
        name: fileData.name,
        type: fileData.type,
        size: Buffer.byteLength(buffer),
      }

      const [uploadedFile] = await strapi.plugins.upload.services.upload.upload({
        data: {},
        files: file
      })

      await fs.promises.unlink(filePath);

      ctx.send({
          success: 1,
          file: uploadedFile
      })
    } catch (e) {
      ctx.send({
        success: 0,
        message: e.message
      }, 500)
    }
  }
}
