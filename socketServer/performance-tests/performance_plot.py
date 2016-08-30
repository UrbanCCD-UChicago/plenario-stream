import matplotlib.pyplot as plt
import numpy as np
import json

plt.clf()
plt.close('all')

time = np.array([])
loadavg = np.array([])
freemem = np.array([])
sockets = np.array([])

f = open('performance1000good3.log')

data = json.loads(f.read())

for d in data:
    time = np.append(time, d["time"])
    loadavg = np.append(loadavg, d["loadavg"][0]*1000)
    freemem = np.append(freemem, d["freemem"]/1000000.0)
    sockets = np.append(sockets, d["sockets"])

plt.plot(time, loadavg)
plt.plot(time, freemem)
plt.plot(time, sockets)

plt.axis([0,359,0,1900])
plt.title('t2.small, equivalent of 10 active nodes, unlimited connections', fontsize=12)
plt.legend(['os.loadavg (x1000)', 'os.freemem (MB)', 'sockets'], loc='upper right')

plt.show()

