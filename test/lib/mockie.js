const mock = require('mock-require');

function mockThinkMockHttp() {
  mock('think-mock-http', ()=> {
  })
}

function mockCluster(isMaster) {
  mock('cluster', {
    isMaster,
    workers: [],
    on(evtName, cb){
      this[evtName] = cb;
    },
    fork(env = {}){
      let worker = {
        on(evtName, cb){
          this[evtName] = cb;
        },
        once(evtName, cb){
          this.on(evtName, cb)
          if (evtName === 'listening') {
            cb('test address')
          }
        },
        trigger(evtName, args){
          const cluster = require('cluster');
          if (evtName === 'exit') {
            let workers = Array.from(cluster.workers);
            cluster.workers.forEach((item, index)=> {
              if (item === this) {
                workers.splice(index, 1)
              }
            })
            cluster.workers = workers;
          }
          this[evtName](args);
        },
        send(signal){
          // console.log(signal);
        },
        kill(){
          // this.isKilled = true;
        },
        isConnected(){
          return !this.isKilled;
        },
        process: {
          kill: ()=> {
            worker.isKilled = true;
          }
        }
      };
      worker = Object.assign(worker, env);
      let cluster = require('cluster');
      cluster.workers.push(worker)
      return worker;
    },
  })
}

function mockThinkCluster(args = {}) {
  let {agent} = args;
  let obj = Object.assign({
    isAgent(){
      return agent
    },
    Master: class Master {
      forkWorkers(){
        return Promise.resolve();
      }
      forceReloadWorkers(){
      }
    },
    Worker: class Worker {
      constructor(options = {}){
        this.options = options;
      }
      getWorkers(){}
      captureEvents(){
        require('think-cluster').capturedEvents = true;
      }
    },
    Agent: class Agent {
      createServer() {
        require('think-cluster').createdServer = true;
      }
    }
  }, args);

  mock('think-cluster', obj);
}

function mockThinkPm2(args = {}) {
  mock('think-pm2', args);
}

function stop(name) {
  if (!name) {
    mock.stopAll()
  }
  mock.stop(name);
}


module.exports = {
  mockThinkMockHttp,
  mockCluster,
  mockThinkCluster,
  mockThinkPm2,
  stop
}