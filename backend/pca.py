import numpy as np
from sklearn.decomposition import PCA

def pca_to_3(X):
    pca = PCA(n_components=3)
    X_reduced = pca.fit_transform(X)

    return X_reduced