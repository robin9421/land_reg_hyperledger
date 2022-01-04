cd ./dist && composer archive create -t dir -n ../ && cd ..
composer network install --card PeerAdmin@hlfv1 --archiveFile ./dist/land-registry@$1.bna
composer network upgrade -c PeerAdmin@hlfv1 -n land-registry -V $1