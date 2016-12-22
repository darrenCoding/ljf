#!/bin/sh

# 变量
path_list=$(echo $1 | tr ";" "\n")
localTrunk=$2
remoteTrunk=$3
commitmsg=$4

isNT=$(uname)

# 路径检查
if [[ -d $localTrunk ]]; then
	pass
else
	echo "local svn path '$localTrunk' not found."
	echo "exit 1"
	exit 1;
fi
if [[ -d $remoteTrunk ]]; then
	pass
else
	echo "remote svn path '$remoteTrunk' not found."
	echo "exit 1"
	exit 1;
fi


echo "开始部署"
echo ""
echo "更新online库"

svn up $remoteTrunk

echo ""

# 移动文件到210库
cd $localTrunk
# copy files
echo "同步文件"
for path in $path_list; do
	echo "move $path to $remoteTrunk"
	rsync -ravu --delete $path $remoteTrunk
    #cp -rfu $localTrunk$path $remoteTrunk
done

echo ""

cd $remoteTrunk
echo "改动文件"
echo `svn status`


# 部署线上 svn
echo ""
echo 提交线上 svn
svn status | grep ^! | xargs | sed 's/\!//g'| xargs svn rm
svn status | grep ^? | xargs | sed 's/\?//g'| xargs svn add
svn ci -m $commitmsg
echo ""

echo "部署完成"
echo ""
echo "开始清缓存"
exit 0