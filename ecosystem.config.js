module.exports = {
  apps: [
    {
      name: 'cami-back',
      exec_mode: 'cluster',
      instances: 'max', // Or a number of instances
      script: './src/index.js',
      args: 'start'
    }
  ]
}