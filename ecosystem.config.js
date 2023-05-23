module.exports = {
  apps: [
    {
      name: 'cami-back',
      exec_mode: 'cluster',
      instances: 'max', // Or a number of instances
      script: 'index.js',
      args: 'start'
    }
  ]
}