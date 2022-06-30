import fetch from "node-fetch"

const handler = async function (event) {
  try {
    const { queryStringParameters } = event
    const { url } = queryStringParameters
    const response = await fetch(url)
    if (!response.ok) {
      // NOT res.status >= 200 && res.status < 300
      return { statusCode: response.status, body: response.statusText }
    }
    const data = await response.text()

    return {
      statusCode: 200,
      body: data,
    }
  } catch (error) {
    // output to netlify function log
    console.log(error)
    return {
      statusCode: 500,
      // Could be a custom message or object i.e. JSON.stringify(err)
      body: JSON.stringify({ msg: error.message }),
    }
  }
}

module.exports = { handler }
