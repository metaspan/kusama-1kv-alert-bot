import 'dotenv/config'

const config = {
  validator_url: 'ws://192.168.1.92:40425',
  bot_token: process.env.bot_token,
  app_id: process.env.app_id,
  public_key: process.env.public_key,
  candidates_url: 'https://api.metaspan.io/api/kusama/candidate',
  nominators_url: 'https://kusama.w3f.community/nominators',
  update_interval: 15 * 1000,
  // the channel to send 'private' messages to myself
  channel_id: '983358544650858507'
}

export default config
