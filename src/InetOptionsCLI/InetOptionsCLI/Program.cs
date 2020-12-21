using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace InetOptionsCLI
{
    class Program
    {
        static void Main(string[] args)
        {
            if (args.Length == 0)
            {
                DisableProxy();
            }
            else
            {
                SetProxy(args[0]);
            }
        }

        static void SetProxy(String proxyAddress)
        {
            INETOptions.ProxyAddress = proxyAddress;
            INETOptions.IsProxyEnabled = true;
            INETOptions.IsIgnoringLocalTraffic = true;
            INETOptions.Save();
        }

        static void DisableProxy()
        {
            INETOptions.IsProxyEnabled = false;
            INETOptions.IsIgnoringLocalTraffic = true;
            INETOptions.Save();
        }
    }
}
