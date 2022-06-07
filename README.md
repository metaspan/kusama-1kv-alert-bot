# kusama-1kv-alert-bot

Use this bot to notify you of valid / active status on Kusama 1KV

## Getting started

```
git clone https://github.com/metaspan/kusama-1kv-alert-bot
cd kusama-1kv-alert-bot
npm install
```

## Dependencies

- Register an app with discord
- update the config.js with your `app_id`

## Forever / pm2

`pm2 start bot.js`

## Usage

```
Here is the list of commands I understand:
  !help - displays this message
  !list - list your subscriptions
  !format json|pretty - set your message format
  !interval [3600] - get|set message interval (seconds)
  !once <validator stash> - get data once
  !sub <validator stash> - subscribe to alerts
  !unsub <validator stash> - unsubscribe from alerts
  !leave - remove all data
```

## References

- https://polkadot.network/blog/join-kusamas-thousand-validators-programme/
- 1KV Status from https://kusama.w3f.community/candidates

## Example messages

![image](https://user-images.githubusercontent.com/1845970/172218717-65e69252-9cb4-4cee-a92e-95d3679a0ad7.png)
