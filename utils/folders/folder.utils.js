const Folder = require('../../modules/folders/folder.model');

exports.getOrCreateNestedFolder = async (
  folderPathParts,
  rootFolder,
  userId
) => {
  let currentFolder = rootFolder;

  for (const folderName of folderPathParts) {
    let subfolder = await Folder.findOne({
      name: folderName,
      parentId: currentFolder._id,
    });

    if (!subfolder) {
      subfolder = new Folder({
        name: folderName,
        type: 'folder',
        createdBy: userId,
        parentId: currentFolder._id,
      });
      await subfolder.save();

      currentFolder.subfolders.push(subfolder._id);
      await currentFolder.save();
    }

    currentFolder = subfolder;
  }

  return currentFolder;
};
