import { useState, useEffect } from "react";
import {
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  AbsoluteCenter,
  Spinner,
} from "@chakra-ui/react";
import { StarIcon } from "@chakra-ui/icons";

import BookmarkList, { BookmarkListType } from "../BookmarkList";
import BookmarkFoldersContext from "./BookmarkFoldersContext";
import CreateFolder from "./CreateFolder";

const fetchBookmarksFoldersAndSortByItemsCount = async (): Promise<
  chrome.bookmarks.BookmarkTreeNode[]
> => {
  const bookmarksTree = await chrome.bookmarks.getTree();
  const bookmarksFolders = bookmarksTree[0].children || [];

  bookmarksFolders.sort((a, b) => {
    if (!a.children) return -1;
    if (!b.children) return 1;
    if (!a.children && !b.children) return 0;

    return b.children?.length - a.children?.length;
  });

  return bookmarksFolders;
};

const fetchFoldersAndAddToState = async (
  setStateCallback: (folder: chrome.bookmarks.BookmarkTreeNode[]) => void
): Promise<void> => {
  const sortedFolders = await fetchBookmarksFoldersAndSortByItemsCount();
  setStateCallback(sortedFolders);
};

const BookmarkFolderTabs = () => {
  const [folders, setFolders] = useState<chrome.bookmarks.BookmarkTreeNode[]>(
    []
  );

  useEffect(() => {
    fetchFoldersAndAddToState(setFolders);
  }, []);

  const getSortedBookmarksInsideFolder = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    const bookmarks = folder?.children || [];
    let sortedBookmarks: chrome.bookmarks.BookmarkTreeNode[] = [];

    if (bookmarks.length) {
      // @ts-ignore: Unreachable code error
      sortedBookmarks = bookmarks.sort((a, b) => b.dateAdded - a.dateAdded);
    }

    return sortedBookmarks;
  };

  const getFolderBookmarksCount = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    return folder?.children ? folder.children.length : 0;
  };

  const BookmarksContent = () => {
    const isBookmarksListLoading = folders.length === 0;

    if (!isBookmarksListLoading) {
      return (
        <Tabs size="sm" colorScheme="teal">
          <>
            <TabList w="max-content">
              {folders.map(({ title, id }) => (
                <Tab key={id}>
                  <StarIcon mr="5px" />
                  {`${title} (${getFolderBookmarksCount(id)})`}
                </Tab>
              ))}
            </TabList>

            <TabPanels>
              {folders.map(({ id, title }) => (
                <TabPanel p="5px" key={`tab-${id}`}>
                  <CreateFolder parentId={id} />

                  <BookmarkList
                    type={BookmarkListType.List}
                    title={title}
                    bookmarks={getSortedBookmarksInsideFolder(id)}
                    folderId={id}
                  />
                </TabPanel>
              ))}
            </TabPanels>
          </>
        </Tabs>
      );
    }

    return (
      <AbsoluteCenter color="white" axis="both">
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="teal.300"
          size="xl"
        />
      </AbsoluteCenter>
    );
  };

  return (
    <BookmarkFoldersContext.Provider
      value={{
        folders,
        refreshFolders: () => fetchFoldersAndAddToState(setFolders),
      }}
    >
      <BookmarksContent />
    </BookmarkFoldersContext.Provider>
  );
};

export default BookmarkFolderTabs;
