clean:
	rm -rf ./vss_linux_amd64 
	rm -rf ./vss_linux_amd64.tar.gz
	rm -rf ./vss

# for linux
setup: clean
	curl -OL https://github.com/zztkm/vss/releases/latest/download/vss_linux_amd64.tar.gz
	tar -xvf vss_linux_amd64.tar.gz
	cp vss_linux_amd64/vss .

build:
	./vss build