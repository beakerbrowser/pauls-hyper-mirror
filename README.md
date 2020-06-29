# Paul's Hyper Mirror

A service that watches the `/mirror.json` of the given hyperdrive and automatically mirrors the URLs listed.

```
npm i
npm start ${drive_with_mirror.json}
```

The `mirror.json` should just be an array of hyper:// URLs.

**NOTE** currently only supports hyperdrives.