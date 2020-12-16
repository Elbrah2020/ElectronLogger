using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace INETOptions
{
    class Binding
    {

        public async Task<object> SetProxy(dynamic proxyAddress)
        {
            INETOptions.HTTPAddress = proxyAddress;
            INETOptions.HTTPSAddress = proxyAddress;
            INETOptions.IsProxyEnabled = true;
            INETOptions.IsIgnoringLocalTraffic = true;
            INETOptions.Save();
            return true;
        }

        public async Task<object> DisableProxy(dynamic test)
        {
            INETOptions.IsProxyEnabled = false;
            INETOptions.IsIgnoringLocalTraffic = true;
            INETOptions.Save();
            return true;
        }
    }
}
