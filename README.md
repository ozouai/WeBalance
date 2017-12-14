# OuiProxy

An easy to use home load-balancing proxy

### Features
* Easy to use web interface
* SSL termination
* Lets Encrypt support
* Load Balancer

### Future Features
* Page Rules
* Request affinity

---

OuiProxy is a proxy written in Node.JS to allow you to host multiple web servers behind a single ip address. Using the web interface, you can expose new routes and route them to servers in your local network. You can also quickly enable SSL, allowing clients that support SNI to see a valid certificate. Let's Encrypt is built into the proxy, and you can request certificates directly from the web interface. 

OuiProxy supports routing requests to multiple target servers, can handle target servers failing, and provide default routes.




